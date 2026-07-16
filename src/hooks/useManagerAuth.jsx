
# 2. useManagerAuth.jsx — Manager auth hook
manager_auth_hook = '''import { useState, useEffect, createContext, useContext } from 'react'
import { supabase } from './useSupabase'

const ManagerAuthContext = createContext(null)

export function ManagerAuthProvider({ children }) {
  const [manager, setManager] = useState(null)
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const stored = localStorage.getItem('crf_manager')
    if (stored) {
      try {
        setManager(JSON.parse(stored))
      } catch { localStorage.removeItem('crf_manager') }
    }
    setLoading(false)
  }, [])

  const login = async (username, password) => {
    const { data, error } = await supabase
      .from('managers')
      .select('*')
      .eq('username', username)
      .eq('password_hash', password) -- In production, hash this!
      .eq('status', 'approved')
      .single()

    if (error || !data) throw new Error('Invalid credentials or account not approved')
    
    setManager(data)
    localStorage.setItem('crf_manager', JSON.stringify(data))
    return data
  }

  const register = async (username, email, password) => {
    const { data: existing } = await supabase
      .from('managers')
      .select('id')
      .eq('username', username)
      .single()
    
    if (existing) throw new Error('Username already taken')

    const { data, error } = await supabase
      .from('managers')
      .insert([{
        username,
        email,
        password_hash: password, -- In production, hash this!
        status: 'pending',
      }])
      .select()
      .single()

    if (error) throw error
    return data
  }

  const logout = () => {
    setManager(null)
    localStorage.removeItem('crf_manager')
  }

  return (
    <ManagerAuthContext.Provider value={{ manager, login, logout, register, loading }}>
      {children}
    </ManagerAuthContext.Provider>
  )
}

export const useManagerAuth = () => {
  const context = useContext(ManagerAuthContext)
  if (!context) throw new Error('useManagerAuth must be used within ManagerAuthProvider')
  return context
}
'''

with open('/mnt/agents/output/useManagerAuth.jsx', 'w') as f:
    f.write(manager_auth_hook)

print("✅ useManagerAuth.jsx created")
