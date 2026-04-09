export interface AuthUser {
  id: string
  email: string
  name: string
  role: 'admin' | 'manager'
  avatarUrl?: string
}

export interface Session {
  token: string
  user: AuthUser
}
