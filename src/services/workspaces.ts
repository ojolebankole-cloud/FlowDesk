import { api } from './api';
export type WorkspaceRole='OWNER'|'ADMIN'|'MANAGER'|'MEMBER'|'VIEWER';
export interface Workspace {id:string;name:string;slug:string;description?:string|null;logoUrl?:string|null;role:WorkspaceRole;memberCount:number;projectCount:number;taskCount:number}
export const workspaceService={
 list:()=>api<{workspaces:Workspace[]}>('/workspaces'),
 create:(body:{name:string;description?:string})=>api<{workspace:Workspace}>('/workspaces',{method:'POST',body:JSON.stringify(body)}),
 get:(id:string)=>api<{workspace:Workspace}>(`/workspaces/${id}`),
 update:(id:string,body:Partial<Pick<Workspace,'name'|'description'|'logoUrl'>>)=>api<{workspace:Workspace}>(`/workspaces/${id}`,{method:'PATCH',body:JSON.stringify(body)}),
 members:(id:string)=>api<{members:Array<{id:string;role:WorkspaceRole;user:{id:string;name:string;email:string;avatarUrl?:string|null}}> }>(`/workspaces/${id}/members`),
 invitations:(id:string)=>api<{invitations:Array<{id:string;email:string;role:WorkspaceRole;status:string;expiresAt:string;createdAt:string}>}>(`/workspaces/${id}/invitations`),
 revokeInvitation:(id:string,invitationId:string)=>api(`/workspaces/${id}/invitations/${invitationId}`,{method:'DELETE'}),
 invite:(id:string,email:string,role:Exclude<WorkspaceRole,'OWNER'>)=>api<{invitation:{id:string;email:string;role:WorkspaceRole;expiresAt:string};acceptanceToken?:string;delivery:string}>(`/workspaces/${id}/invitations`,{method:'POST',body:JSON.stringify({email,role})}),
 accept:(token:string)=>api<{message:string;workspaceId:string}>('/workspaces/invitations/accept',{method:'POST',body:JSON.stringify({token})}),
 setRole:(id:string,memberId:string,role:Exclude<WorkspaceRole,'OWNER'>)=>api(`/workspaces/${id}/members/${memberId}/role`,{method:'PATCH',body:JSON.stringify({role})}),
 remove:(id:string,memberId:string)=>api(`/workspaces/${id}/members/${memberId}`,{method:'DELETE'})
};
