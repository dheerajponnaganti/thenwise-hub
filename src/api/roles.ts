// Mirrors the server's role rules so the console can hide what a role cannot do. The server enforces them anyway.
export const ROLES = ['viewer', 'member', 'editor', 'admin', 'owner'] as const
export type Role = (typeof ROLES)[number]
const NEED = { read: 'viewer', share: 'member', curate: 'editor', admin: 'admin', owner: 'owner' } as const
export type Action = keyof typeof NEED

export const can = (role: string | undefined, action: Action): boolean => {
  const have = ROLES.indexOf(role as Role)
  return have >= 0 && have >= ROLES.indexOf(NEED[action])
}
