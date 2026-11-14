import { api } from './api';
export interface AuthUser { id: string; name: string; email: string; emailVerified: boolean; twoFactorEnabled: boolean; platformRole?:string }
export interface AuthResult { user: AuthUser; requiresTwoFactor?: boolean; challengeToken?: string }
export const authService = {
  me: () => api<{user: AuthUser}>('/auth/me'),
  register: (body: {name:string;email:string;password:string}) => api<{message:string}>('/auth/register',{method:'POST',body:JSON.stringify(body)}),
  login: (body: {email:string;password:string;totpCode?:string;challengeToken?:string}) => api<AuthResult>('/auth/login',{method:'POST',body:JSON.stringify(body)}),
  logout: () => api<void>('/auth/logout',{method:'POST'}),
  verifyEmail: (token:string) => api<{message:string}>('/auth/verify-email',{method:'POST',body:JSON.stringify({token})}),
  forgotPassword: (email:string) => api<{message:string}>('/auth/forgot-password',{method:'POST',body:JSON.stringify({email})}),
  resetPassword: (token:string,password:string) => api<{message:string}>('/auth/reset-password',{method:'POST',body:JSON.stringify({token,password})}),
  setup2fa: () => api<{secret:string;otpauthUrl:string;manualEntryKey:string}>('/auth/2fa/setup',{method:'POST'}),
  enable2fa: (code:string) => api<{message:string;recoveryCodes:string[]}>('/auth/2fa/enable',{method:'POST',body:JSON.stringify({code})}),
  disable2fa: (code:string) => api<{message:string}>('/auth/2fa/disable',{method:'POST',body:JSON.stringify({code})}),
  sessions: () => api<{sessions:Array<{id:string;createdAt:string;expiresAt:string;userAgent:string|null;ipAddress:string|null}>}>('/auth/sessions'),
  revokeSession: (id:string) => api<void>(`/auth/sessions/${id}`,{method:'DELETE'}),
};
