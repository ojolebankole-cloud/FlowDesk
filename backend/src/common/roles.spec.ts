import { rolePermissions } from './roles';
describe('workspace role permission matrix',()=>{
 it('grants owners all permissions',()=>expect(rolePermissions.OWNER).toContain('*'));
 it('restricts viewers to read-only workspace capabilities',()=>{expect(rolePermissions.VIEWER).toContain('projects:read');expect(rolePermissions.VIEWER).not.toContain('projects:create');expect(rolePermissions.VIEWER).not.toContain('projects:delete')});
 it('allows managers to create and update projects but not delete them',()=>{expect(rolePermissions.MANAGER).toContain('projects:create');expect(rolePermissions.MANAGER).toContain('projects:update');expect(rolePermissions.MANAGER).not.toContain('projects:delete')});
 it('keeps file and AI capabilities permission-scoped',()=>{expect(rolePermissions.MEMBER).toContain('files:write');expect(rolePermissions.MEMBER).toContain('ai:use');expect(rolePermissions.VIEWER).toContain('files:read');expect(rolePermissions.VIEWER).not.toContain('files:write');expect(rolePermissions.VIEWER).not.toContain('ai:use')});
 it('does not grant members administrative membership permissions',()=>{expect(rolePermissions.MEMBER).not.toContain('members:manage');expect(rolePermissions.MEMBER).not.toContain('workspace:update')});
});
