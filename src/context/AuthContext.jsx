import { createContext, useContext, useState, useEffect } from 'react'
import { axiosAPI } from '../service/axiosAPI'
import { onMessageListener, requestForToken } from '../firebase'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [user, setUser] = useState(() => {
    const saved = localStorage.getItem('user')
    return saved ? JSON.parse(saved) : null
  })

  useEffect(() => {
    const token = localStorage.getItem('access')
    if (user && token) {
      axiosAPI.get('/users/me/')
        .then(res => {
          const fetchedUser = res.data?.data ?? res.data
          if (fetchedUser) {
            // localStorage dagi active_role ni saqlab qolish
            // (backend /users/me/ active_role ni qaytarmasligi mumkin)
            const savedUser = JSON.parse(localStorage.getItem('user') || '{}')
            const mergedUser = {
              ...fetchedUser,
              active_role: fetchedUser.active_role || savedUser.active_role || fetchedUser.roles?.[0],
            }
            setUser(mergedUser)
            localStorage.setItem('user', JSON.stringify(mergedUser))
          }
        })
        .catch(err => {
          console.error('User sync failed', err)
        })
    }
  }, [])

  const login = async (login, parol) => {
    try {
      const response = await axiosAPI.post('/auth/login/', { username: login, password: parol })
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
    <AuthContext.Provider value={{ user, login, logout, setUser }}>
      {children}
    </AuthContext.Provider>
  )
}

export const useAuth = () => useContext(AuthContext)
