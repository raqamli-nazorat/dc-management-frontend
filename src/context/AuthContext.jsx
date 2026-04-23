import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

const USERS = [
  { login: 'admin', parol: 'admin', role: 'admin', name: 'Administrator' },
  { login: 'menager', parol: 'menager', role: 'menager', name: 'Menejer' },
  { login: 'xodim', parol: 'xodim', role: 'xodim', name: 'Xodim' },
]

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('rn_user')
    return saved ? JSON.parse(saved) : null
  })

  const login = (login, parol) => {
    const found = USERS.find(u => u.login === login && u.parol === parol)
    if (found) {
      setUser(found)
      localStorage.setItem('rn_user', JSON.stringify(found))
      return { success: true, role: found.role }
    }
    return { success: false }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('rn_user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
