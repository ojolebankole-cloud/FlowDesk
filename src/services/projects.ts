import { api } from './api';
export interface Project {id:string;workspaceId:string;name:string;description:string|null;status:'PLANNING'|'ACTIVE'|'ON_HOLD'|'COMPLETED'|'ARCHIVED';priority:'LOW'|'MEDIUM'|'HIGH'|'URGENT';startDate:string|null;dueDate:string|null;budget:string|null;currency:string;progress:number;assigneeId:string|null;createdAt:string;updatedAt:string}
export const projectService={
 list:(workspaceId:string,q='')=>api<{projects:Project[]}>(`/workspaces/${workspaceId}/projects${q?`?q=${encodeURIComponent(q)}`:''}`),
 create:(workspaceId:string,body:Omit<Partial<Project>,'budget'>&{name:string;budget?:number|string|null})=>api<{project:Project}>(`/workspaces/${workspaceId}/projects`,{method:'POST',body:JSON.stringify(body)}),
 detail:(workspaceId:string,id:string)=>api<{project:Project}>(`/workspaces/${workspaceId}/projects/${id}`),
 update:(workspaceId:string,id:string,body:Omit<Partial<Project>,'budget'>&{budget?:number|string|null})=>api<{project:Project}>(`/workspaces/${workspaceId}/projects/${id}`,{method:'PATCH',body:JSON.stringify(body)}),
 archive:(workspaceId:string,id:string)=>api(`/workspaces/${workspaceId}/projects/${id}/archive`,{method:'POST'}),
 remove:(workspaceId:string,id:string)=>api(`/workspaces/${workspaceId}/projects/${id}`,{method:'DELETE'}),
 addMilestone:(workspaceId:string,id:string,body:{title:string;description?:string;dueDate?:string})=>api(`/workspaces/${workspaceId}/projects/${id}/milestones`,{method:'POST',body:JSON.stringify(body)}),
 completeMilestone:(workspaceId:string,id:string,milestoneId:string)=>api(`/workspaces/${workspaceId}/projects/${id}/milestones/${milestoneId}/complete`,{method:'POST'})
};
