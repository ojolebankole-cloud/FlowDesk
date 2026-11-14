import {
  BadGatewayException,
  BadRequestException,
  ForbiddenException,
  Injectable,
  NotFoundException,
  ServiceUnavailableException,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { PrismaService } from '../prisma/prisma.service';
import { WorkspacesService } from '../workspaces/workspaces.service';
import { BILLING_PLANS } from '../billing/billing.service';

const OPENROUTER_BASE_URL = 'https://openrouter.ai/api/v1';
const DEFAULT_OPENROUTER_MODEL = 'nvidia/nemotron-3-ultra-550b-a55b:free';
const MAX_HISTORY_MESSAGES = 16;
const MAX_OUTPUT_TOKENS = 1200;

interface AiProviderConfig {
  key: string;
  provider: string;
  model: string;
  baseUrl: string;
  planCode: string;
  includeWorkspaceContext: boolean;
}

@Injectable()
export class AiService {
  constructor(
    private readonly db: PrismaService,
    private readonly cfg: ConfigService,
    private readonly ws: WorkspacesService,
  ) {}

  private async access(userId: string, workspaceId: string): Promise<AiProviderConfig> {
    const feature = await this.db.platformSetting.findUnique({ where: { key: 'aiEnabled' } });
    if (feature?.value === false) {
      throw new ServiceUnavailableException('FlowDesk AI has been disabled by the platform administrator.');
    }

    const member = await this.ws.requireMember(userId, workspaceId);
    if (member.role === 'VIEWER') {
      throw new ForbiddenException('AI access is not enabled for read-only members.');
    }

    const subscription = await this.db.workspaceSubscription.findUnique({ where: { workspaceId } });
    const planCode = subscription && ['ACTIVE', 'TRIALING'].includes(subscription.status)
      ? subscription.planCode
      : 'FREE';
    const plan = BILLING_PLANS.find((item) => item.code === planCode) || BILLING_PLANS[0];
    if (!(plan.features as readonly string[]).includes('ai')) {
      throw new ForbiddenException('FlowDesk AI requires the Business or Scale subscription.');
    }

    const key = this.cfg.get<string>('AI_API_KEY')?.trim();
    if (!key) {
      throw new ServiceUnavailableException('OpenRouter is not configured. Set AI_API_KEY on the backend.');
    }

    const provider = (this.cfg.get<string>('AI_PROVIDER') || 'openrouter').toLowerCase();
    if (provider !== 'openrouter') {
      throw new ServiceUnavailableException('This FlowDesk build is configured for the OpenRouter provider.');
    }

    return {
      key,
      provider,
      model: this.cfg.get<string>('AI_MODEL') || DEFAULT_OPENROUTER_MODEL,
      baseUrl: (this.cfg.get<string>('AI_BASE_URL') || OPENROUTER_BASE_URL).replace(/\/+$/, ''),
      planCode,
      // Free upstream endpoints may process prompts for provider improvement. Do not
      // disclose customer/workspace records unless the operator explicitly opts in.
      includeWorkspaceContext: this.cfg.get<string>('AI_INCLUDE_WORKSPACE_CONTEXT') === 'true',
    };
  }

  async conversations(userId: string, workspaceId: string) {
    await this.accessMembership(userId, workspaceId);
    return {
      conversations: await this.db.aiConversation.findMany({
        where: { workspaceId, userId },
        orderBy: { updatedAt: 'desc' },
        select: { id: true, title: true, provider: true, model: true, createdAt: true, updatedAt: true },
      }),
    };
  }

  private async accessMembership(userId: string, workspaceId: string) {
    await this.ws.requireMember(userId, workspaceId);
  }

  async history(userId: string, workspaceId: string, id: string) {
    await this.accessMembership(userId, workspaceId);
    const conversation = await this.db.aiConversation.findFirst({
      where: { id, workspaceId, userId },
      include: { messages: { orderBy: { createdAt: 'asc' } } },
    });
    if (!conversation) throw new NotFoundException('Conversation not found.');
    return { conversation };
  }

  async chat(userId: string, workspaceId: string, id: string | undefined, message: string) {
    const config = await this.access(userId, workspaceId);
    if (!message?.trim() || message.length > 12000) {
      throw new BadRequestException('Message must contain 1–12000 characters.');
    }

    const monthStart = new Date();
    monthStart.setDate(1);
    monthStart.setHours(0, 0, 0, 0);
    const usageBefore = await this.db.aiUsage.aggregate({
      where: { workspaceId, createdAt: { gte: monthStart } },
      _sum: { inputTokens: true, outputTokens: true },
    });
    const usedTokens = (usageBefore._sum.inputTokens || 0) + (usageBefore._sum.outputTokens || 0);
    const configuredLimit = await this.db.platformSetting.findUnique({ where: { key: 'aiMonthlyTokenLimit' } });
    const configuredNumber = Number(configuredLimit?.value);
    const monthlyLimit = Number.isFinite(configuredNumber) && configuredNumber > 0
      ? configuredNumber
      : config.planCode === 'SCALE' ? 2_000_000 : 500_000;
    if (usedTokens >= monthlyLimit) {
      throw new ForbiddenException('This workspace has reached its monthly AI usage allowance. Usage resets at the start of next month.');
    }

    let conversation = id
      ? await this.db.aiConversation.findFirst({ where: { id, workspaceId, userId } })
      : null;
    if (id && !conversation) throw new NotFoundException('Conversation not found.');
    if (!conversation) {
      conversation = await this.db.aiConversation.create({
        data: {
          workspaceId,
          userId,
          title: message.trim().slice(0, 70),
          provider: config.provider,
          model: config.model,
        },
      });
    }

    let workspaceSnapshot: Record<string, unknown> | null = null;
    if (config.includeWorkspaceContext) {
      const [projects, tasks, customerCount, payments] = await Promise.all([
        this.db.project.findMany({
          where: { workspaceId, archivedAt: null },
          select: { name: true, status: true, progress: true, dueDate: true },
          take: 40,
        }),
        this.db.task.findMany({
          where: { workspaceId },
          select: { title: true, status: true, priority: true, dueDate: true },
          take: 80,
        }),
        this.db.customer.count({ where: { workspaceId } }),
        this.db.payment.groupBy({
          by: ['currency'],
          where: { invoice: { workspaceId } },
          _sum: { amount: true },
        }),
      ]);
      workspaceSnapshot = { projects, tasks, customerCount, paidPaymentsByCurrency: payments };
    }

    await this.db.aiMessage.create({
      data: { conversationId: conversation.id, role: 'user', content: message.trim() },
    });
    const history = await this.db.aiMessage.findMany({
      where: { conversationId: conversation.id },
      orderBy: { createdAt: 'desc' },
      take: MAX_HISTORY_MESSAGES,
    });

    const systemPrompt = workspaceSnapshot
      ? `You are FlowDesk AI, a careful business-workspace assistant. Only use the supplied workspace snapshot for claims about this workspace. Do not invent records, financial figures, customer details, or completed actions. If data is missing, say so. Do not claim to perform actions; explain what the user can do. Workspace snapshot JSON: ${JSON.stringify(workspaceSnapshot)}`
      : 'You are FlowDesk AI, a helpful business assistant. The operator has disabled sharing workspace records with the AI provider. Do not claim to know this workspace\'s projects, tasks, customers, invoices, or financial figures. Give general guidance and ask the user to provide non-sensitive details when needed. Never claim to perform actions.';

    const appUrl = this.cfg.get<string>('APP_URL') || this.cfg.get<string>('WEB_ORIGIN')?.split(',')[0]?.trim();
    const headers: Record<string, string> = {
      Authorization: `Bearer ${config.key}`,
      'Content-Type': 'application/json',
      'X-Title': 'FlowDesk',
    };
    if (appUrl) headers['HTTP-Referer'] = appUrl;

    let response: Response;
    try {
      response = await fetch(`${config.baseUrl}/chat/completions`, {
        method: 'POST',
        headers,
        signal: AbortSignal.timeout(60000),
        body: JSON.stringify({
          model: config.model,
          temperature: 0.2,
          max_tokens: MAX_OUTPUT_TOKENS,
          // OpenRouter only guarantees token accounting when usage is explicitly requested.
          usage: { include: true },
          messages: [
            { role: 'system', content: systemPrompt },
            ...history.reverse().map((item) => ({
              role: item.role as 'user' | 'assistant',
              content: item.content,
            })),
          ],
        }),
      });
    } catch {
      throw new BadGatewayException('OpenRouter could not be reached. Check backend network access and try again.');
    }

    if (!response.ok) {
      // Do not forward raw upstream bodies: they can contain provider diagnostics.
      if (response.status === 401 || response.status === 403) {
        throw new ServiceUnavailableException('OpenRouter rejected the API key. Check AI_API_KEY on the backend.');
      }
      if (response.status === 402) {
        throw new ServiceUnavailableException('OpenRouter requires credits for the selected model or route. Check that AI_MODEL is a free model.');
      }
      if (response.status === 429) {
        throw new ServiceUnavailableException('The OpenRouter free-model rate limit was reached. Please wait and try again.');
      }
      throw new BadGatewayException(`OpenRouter returned an upstream error (${response.status}).`);
    }

    let payload: any;
    try {
      payload = await response.json();
    } catch {
      throw new BadGatewayException('OpenRouter returned an invalid response.');
    }

    const answer = payload?.choices?.[0]?.message?.content;
    if (typeof answer !== 'string' || !answer.trim()) {
      throw new BadGatewayException('OpenRouter returned an empty response.');
    }

    const inputTokens = Number.isFinite(Number(payload?.usage?.prompt_tokens))
      ? Number(payload.usage.prompt_tokens) : 0;
    const outputTokens = Number.isFinite(Number(payload?.usage?.completion_tokens))
      ? Number(payload.usage.completion_tokens) : 0;

    await this.db.$transaction([
      this.db.aiMessage.create({
        data: {
          conversationId: conversation.id,
          role: 'assistant',
          content: answer,
          inputTokens: inputTokens || null,
          outputTokens: outputTokens || null,
        },
      }),
      this.db.aiUsage.create({
        data: {
          workspaceId,
          userId,
          provider: config.provider,
          model: config.model,
          inputTokens,
          outputTokens,
        },
      }),
    ]);
    await this.db.aiConversation.update({ where: { id: conversation.id }, data: { updatedAt: new Date() } });

    return {
      conversationId: conversation.id,
      answer,
      usage: { inputTokens, outputTokens },
      provider: config.provider,
      model: config.model,
    };
  }

  async usage(userId: string, workspaceId: string) {
    const member = await this.ws.requireMember(userId, workspaceId);
    if (!['OWNER', 'ADMIN'].includes(member.role)) throw new ForbiddenException();
    const rows = await this.db.aiUsage.groupBy({
      by: ['provider', 'model'],
      where: { workspaceId },
      _sum: { inputTokens: true, outputTokens: true },
      _count: { _all: true },
    });
    return { usage: rows };
  }
}
