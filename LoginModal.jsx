import React, { useState } from 'react'
import { useAuth } from '../hooks/useAuth'
import { X, Mail, Lock, AlertCircle } from 'lucide-react'

function LoginModal({ onClose }) {
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [isSignUp, setIsSignUp] = useState(false)
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const { signIn, signUp } = useAuth()

  const handleSubmit = async (e) => {
    e.preventDefault()
    setError('')
    setLoading(true)

    try {
      if (isSignUp) {
        const { error } = await signUp(email, password)
        if (error) throw error
        setError('Account created! You can now sign in.')
        setIsSignUp(false)
      } else {
        const { error } = await signIn(email, password)
        if (error) throw error
        onClose()
      }
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{
          padding: '24px',
          borderBottom: '1px solid #2a2a4a',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
        }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>
            {isSignUp ? 'Create Account' : 'Admin Login'}
          </h2>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              color: '#a0a0a0',
              cursor: 'pointer',
              padding: '4px',
            }}
          >
            <X size={24} />
          </button>
        </div>

        <div style={{ padding: '24px' }}>
          {error && (
            <div style={{
              background: error.includes('created') ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
              border: `1px solid ${error.includes('created') ? 'rgba(34, 197, 94, 0.3)' : 'rgba(239, 68, 68, 0.3)'}`,
              borderRadius: '8px',
              padding: '12px',
              marginBottom: '20px',
              display: 'flex',
              alignItems: 'center',
              gap: '8px',
              color: error.includes('created') ? '#22c55e' : '#ef4444',
              fontSize: '0.875rem',
            }}>
              <AlertCircle size={16} />
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#a0a0a0',
              }}>
                Email
              </label>
              <div style={{ position: 'relative' }}>
                <Mail size={18} style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#a0a0a0',
                }} />
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="crf-input"
                  style={{ paddingLeft: '44px' }}
                  placeholder="admin@crfleague.com"
                  required
                />
              </div>
            </div>

            <div style={{ marginBottom: '24px' }}>
              <label style={{
                display: 'block',
                marginBottom: '6px',
                fontSize: '0.875rem',
                fontWeight: 600,
                color: '#a0a0a0',
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <Lock size={18} style={{
                  position: 'absolute',
                  left: '14px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#a0a0a0',
                }} />
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="crf-input"
                  style={{ paddingLeft: '44px' }}
                  placeholder="••••••••"
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              type="submit"
              className="crf-btn crf-btn-primary"
              style={{ width: '100%', justifyContent: 'center' }}
              disabled={loading}
            >
              {loading ? 'Please wait...' : (isSignUp ? 'Create Account' : 'Sign In')}
            </button>
          </form>

          <p style={{
            textAlign: 'center',
            marginTop: '16px',
            fontSize: '0.875rem',
            color: '#a0a0a0',
          }}>
            {isSignUp ? 'Already have an account?' : "Don't have an account?"}{' '}
            <button
              onClick={() => { setIsSignUp(!isSignUp); setError('') }}
              style={{
                background: 'none',
                border: 'none',
                color: '#e94560',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
              }}
            >
              {isSignUp ? 'Sign In' : 'Sign Up'}
            </button>
          </p>
        </div>
      </div>
    </div>
  )
}

export default LoginModal
