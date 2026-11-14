import { UnauthorizedException } from '@nestjs/common';
import { AuthService } from './auth.service';

describe('AuthService',()=>{
 const prisma:any={user:{findUnique:jest.fn(),create:jest.fn(),update:jest.fn()},session:{create:jest.fn()},emailVerificationToken:{create:jest.fn(),findUnique:jest.fn(),delete:jest.fn()},passwordResetToken:{create:jest.fn(),findUnique:jest.fn(),update:jest.fn()},$transaction:jest.fn()};
 const mail:any={send:jest.fn()};const config:any={get:(key:string)=>({APP_URL:'http://localhost:5173',WEB_ORIGIN:'http://localhost:5173',SESSION_TTL_DAYS:'14'}[key])};
 const service=new AuthService(prisma,mail,config);
 beforeEach(()=>jest.clearAllMocks());
 it('does not authenticate an unknown email',async()=>{
  prisma.user.findUnique.mockResolvedValue(null);
  await expect(service.login({email:'missing@example.com',password:'not-the-password'},{})).rejects.toBeInstanceOf(UnauthorizedException);
 });
 it('returns a generic password reset response for an unknown email',async()=>{
  prisma.user.findUnique.mockResolvedValue(null);
  await expect(service.forgotPassword('unknown@example.com')).resolves.toEqual({message:'If an account exists for that address, password-reset instructions have been sent.'});
  expect(mail.send).not.toHaveBeenCalled();
 });
});
