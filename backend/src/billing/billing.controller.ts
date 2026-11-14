import { Body, Controller, Get, Headers, Param, Post, Req, UseGuards } from '@nestjs/common';
import { IsIn, IsString } from 'class-validator';
import { SessionGuard } from '../auth/session.guard';
import { BillingService } from './billing.service';
class CheckoutDto { @IsIn(['STARTER','BUSINESS','SCALE']) planCode!:string; @IsIn(['month','year']) interval!:string; }
@Controller('billing') export class BillingController { constructor(private service:BillingService){}
 @Get('plans') plans(){return {plans:this.service.plans()};}
 @Post('webhooks/stripe') webhook(@Req() req:any,@Headers('stripe-signature') signature:string){return this.service.handleWebhook(req.rawBody,signature);}
 @UseGuards(SessionGuard) @Get('workspaces/:workspaceId') overview(@Req()r:any,@Param('workspaceId')w:string){return this.service.overview(r.user.id,w);}
 @UseGuards(SessionGuard) @Post('workspaces/:workspaceId/checkout') checkout(@Req()r:any,@Param('workspaceId')w:string,@Body()b:CheckoutDto){return this.service.checkout(r.user.id,w,b);}
 @UseGuards(SessionGuard) @Post('workspaces/:workspaceId/cancel') cancel(@Req()r:any,@Param('workspaceId')w:string){return this.service.cancel(r.user.id,w);}
 @UseGuards(SessionGuard) @Post('workspaces/:workspaceId/resume') resume(@Req()r:any,@Param('workspaceId')w:string){return this.service.resume(r.user.id,w);}
 @UseGuards(SessionGuard) @Post('workspaces/:workspaceId/portal') portal(@Req()r:any,@Param('workspaceId')w:string){return this.service.portal(r.user.id,w);}
}
