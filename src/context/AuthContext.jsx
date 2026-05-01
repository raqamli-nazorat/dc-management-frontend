import { createContext, useContext, useState } from 'react'
import { axiosAPI } from '../service/axiosAPI'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  const login = async (login, parol) => {
    try {
      const response = await axiosAPI.post('/auth/login/', { username: login, password: parol })
      console.log('🔍 API response:', response.data)
      const { data } = response.data
      const userData = data.user
      setUser(userData)
      localStorage.setItem('access', data.access ?? '')
      localStorage.setItem('refresh', data.refresh ?? '')
      localStorage.setItem('user', JSON.stringify(userData))
      return { success: true, roles: userData.roles }
    } catch (error) {
      const responseData = error?.response?.data
      return {
        success: false,
        error: responseData?.error ?? { errorMsg: responseData?.detail ?? "Xato yuz berdi" }
      }
    }
  }

  const logout = () => {
    setUser(null)
    localStorage.removeItem('access')
    localStorage.removeItem('refresh')
    localStorage.removeItem('user')
  }

  return (
    <AuthContext.Provider value={{ user, login, logout }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
