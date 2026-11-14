import { IsEmail, IsOptional, IsString, Length, Matches } from 'class-validator';
export class RegisterDto { @IsString() @Length(2,80) @Matches(/^[\p{L}\p{M}0-9 .'-]+$/u) name:string; @IsEmail() email:string; @IsString() @Length(12,72) password:string; }
export class LoginDto { @IsEmail() email:string; @IsString() @Length(1,128) password:string; @IsOptional() @IsString() @Length(6,16) totpCode?:string; @IsOptional() @IsString() challengeToken?:string; }
export class TokenDto { @IsString() @Length(32,256) token:string; }
export class ResetPasswordDto extends TokenDto { @IsString() @Length(12,72) password:string; }
export class EmailDto { @IsEmail() email:string; }
export class TotpDto { @IsString() @Matches(/^\d{6}$/) code:string; }
