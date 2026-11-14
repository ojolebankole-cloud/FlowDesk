# Phases 16–19 audit notes

- Admin endpoints are protected by `SessionGuard` plus explicit platform-role authorization in `AdminController`.
- Workspace role permissions are not treated as platform admin permissions.
- Platform role changes are restricted to `SUPER_ADMIN`; self role changes are rejected.
- Account suspension deletes active sessions. Last active super administrator protections are enforced before mutation.
- Workspace suspension is checked centrally in `WorkspacesService.requireMember` and in `WorkspaceRoleGuard`.
- Platform setting keys are allowlisted and values validated; secret credentials are not returned by admin settings endpoints.
- Administrative mutations create `AuditEvent` records.
- Settings preferences are user-scoped and have validation for supported enumerations and locale format.
- Outstanding production hardening: require MFA for privileged admin sessions, add approval/step-up authentication for destructive platform actions, add per-workspace quota overrides, and add an operational UI for initial trusted super-admin provisioning.
