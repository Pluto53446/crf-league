import React, { useState } from 'react'
import { supabase } from '../hooks/useSupabase'
import { useManagerAuth } from '../hooks/useManagerAuth'
import { X, LogIn, UserPlus, Loader2, AlertCircle, CheckCircle2 } from 'lucide-react'

const ManagerLoginModal = ({ onClose }) => {
  const { login, register } = useManagerAuth()
  const [mode, setMode] = useState('login') // 'login' | 'register'
  const [username, setUsername] = useState('')
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState(null)

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setMessage(null)
    try {
      await login(username, password)
      setMessage({ text: 'Login successful! Refreshing...', type: 'success' })
      setTimeout(() => window.location.reload(), 1000)
    } catch (err) {
      setMessage({ text: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    if (password !== confirmPassword) {
      setMessage({ text: 'Passwords do not match', type: 'error' })
      return
    }
    if (password.length < 4) {
      setMessage({ text: 'Password must be at least 4 characters', type: 'error' })
      return
    }

    setLoading(true)
    setMessage(null)
    try {
      await register(username, email, password)
      setMessage({ text: 'Application submitted! An admin will review your request.', type: 'success' })
      setTimeout(() => { setMode('login'); setMessage(null) }, 3000)
    } catch (err) {
      setMessage({ text: err.message, type: 'error' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={e => e.stopPropagation()} style={{ maxWidth: '420px' }}>
        <div style={{ padding: '24px', borderBottom: '1px solid var(--crf-border)', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.4rem', fontWeight: 700, fontFamily: 'Oswald, sans-serif' }}>
            {mode === 'login' ? 'Manager Login' : 'Apply as Manager'}
          </h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: 'var(--crf-text-muted)', cursor: 'pointer' }}>
            <X size={24} />
          </button>
        </div>

        {message && (
          <div style={{
            margin: '16px 24px 0',
            padding: '12px 16px',
            borderRadius: '8px',
            display: 'flex',
            alignItems: 'center',
            gap: '8px',
            fontSize: '0.85rem',
            fontWeight: 600,
            background: message.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
            border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
            color: message.type === 'error' ? '#ef4444' : '#22c55e',
          }}>
            {message.type === 'error' ? <AlertCircle size={16} /> : <CheckCircle2 size={16} />}
            {message.text}
          </div>
        )}

        <form onSubmit={mode === 'login' ? handleLogin : handleRegister} style={{ padding: '24px' }}>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--crf-text-muted)' }}>
                Username *
              </label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="crf-input"
                placeholder="Enter username"
                required
                autoFocus
              />
            </div>

            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--crf-text-muted)' }}>
                  Email (optional)
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="crf-input"
                  placeholder="your@email.com"
                />
              </div>
            )}

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--crf-text-muted)' }}>
                Password *
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="crf-input"
                placeholder="Enter password"
                required
              />
            </div>

            {mode === 'register' && (
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: 'var(--crf-text-muted)' }}>
                  Confirm Password *
                </label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(e) => setConfirmPassword(e.target.value)}
                  className="crf-input"
                  placeholder="Confirm password"
                  required
                />
              </div>
            )}
          </div>

          <button
            type="submit"
            disabled={loading}
            className="crf-btn crf-btn-primary"
            style={{ width: '100%', marginTop: '24px', justifyContent: 'center' }}
          >
            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : (mode === 'login' ? <LogIn size={16} /> : <UserPlus size={16} />)}
            {loading ? 'Please wait...' : (mode === 'login' ? 'Login' : 'Submit Application')}
          </button>
        </form>

        <div style={{ padding: '0 24px 24px', textAlign: 'center' }}>
          <button
            onClick={() => { setMode(mode === 'login' ? 'register' : 'login'); setMessage(null) }}
            style={{
              background: 'none',
              border: 'none',
              color: '#e94560',
              cursor: 'pointer',
              fontSize: '0.85rem',
              fontWeight: 600,
            }}
          >
            {mode === 'login' ? "Don't have an account? Apply as Manager" : 'Already applied? Login'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default ManagerLoginModal
