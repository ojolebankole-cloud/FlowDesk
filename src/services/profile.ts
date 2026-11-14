import { api } from './api';
export interface Profile {id:string;name:string;email:string;avatarUrl:string|null;bio:string|null;timezone:string|null;createdAt:string;emailVerifiedAt:string|null;twoFactorEnabled:boolean}
export const profileService={get:()=>api<{user:Profile}>('/users/me'),update:(body:Partial<Pick<Profile,'name'|'avatarUrl'|'bio'|'timezone'>>)=>api<{user:Profile}>('/users/me',{method:'PATCH',body:JSON.stringify(body)})};
