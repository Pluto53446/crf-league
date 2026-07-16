import React, { useState } from 'react'
import { Routes, Route, NavLink, useNavigate } from 'react-router-dom'
import { useAuth } from './hooks/useAuth'
import { ManagerAuthProvider, useManagerAuth } from './hooks/useManagerAuth'
import { 
  Shield, 
  Users, 
  Trophy, 
  ShoppingCart,
  User, 
  LayoutDashboard,
  LogIn,
  LogOut,
  Menu,
  X,
  ChevronRight,
  Swords,
  BarChart3,
  Briefcase
} from 'lucide-react'
import MasterSheet from './components/MasterSheet'
import ClubRosters from './components/ClubRosters'
import Leaderboards from './components/Leaderboards'
import TransferListings from './components/TransferListings'
import PlayerSheet from './components/PlayerSheet'
import AdminPanel from './components/AdminPanel'
import LoginModal from './components/LoginModal'
import ManagerLoginModal from './components/ManagerLoginModal'
import ManagerDashboard from './components/ManagerDashboard'
import Competitions from './components/Competitions'
import Standings from './components/Standings'

function AppContent() {
  const { user, isAdmin, signOut } = useAuth()
  const { manager, logout: managerLogout } = useManagerAuth()
  const [showLogin, setShowLogin] = useState(false)
  const [showManagerLogin, setShowManagerLogin] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const navigate = useNavigate()

  const handleSignOut = async () => {
    await signOut()
    navigate('/')
  }

  const handleManagerLogout = () => {
    managerLogout()
    navigate('/')
  }

  const navItems = [
    { path: '/', label: 'Master Sheet', icon: Users },
    { path: '/clubs', label: 'Club Rosters', icon: Shield },
    { path: '/leaderboards', label: 'Leaderboards', icon: Trophy },
    { path: '/standings', label: 'Standings', icon: BarChart3 },
    { path: '/competitions', label: 'Competitions', icon: Swords },
    { path: '/transfers', label: 'Transfer Listings', icon: ShoppingCart },
    { path: '/player-sheet', label: 'Player Sheet', icon: User },
  ]

  if (isAdmin) {
    navItems.push({ path: '/admin', label: 'Admin Panel', icon: LayoutDashboard })
  }

  if (manager) {
    navItems.push({ path: '/manager', label: 'Manager Hub', icon: Briefcase })
  }

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Header */}
      <header style={{
        background: 'linear-gradient(135deg, #1a1a2e 0%, #16213e 100%)',
        borderBottom: '2px solid #e94560',
        position: 'sticky',
        top: 0,
        zIndex: 100,
      }}>
        <div style={{
          maxWidth: '1400px',
          margin: '0 auto',
          padding: '0 24px',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '64px',
        }}>
          {/* Logo */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            <img 
              src="https://cdn.discordapp.com/attachments/1497655691521953832/1526618896281505802/MagicEraser_260601_184652.png?ex=6a57ae24&is=6a565ca4&hm=d771b722d7571874f184b47451062fd24b4cfea55789a8076e9c2badf654e8ab&"
              alt="CRF League Logo"
              style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                objectFit: 'cover',
                border: '2px solid #e94560',
              }}
            />
            <div>
              <h1 style={{
                fontFamily: 'Oswald, sans-serif',
                fontSize: '1.3rem',
                fontWeight: 700,
                color: 'white',
                lineHeight: 1,
                letterSpacing: '0.08em',
              }}>
                CRF LEAGUE
              </h1>
              <p style={{
                fontSize: '0.65rem',
                color: '#a0a0a0',
                textTransform: 'uppercase',
                letterSpacing: '0.15em',
                marginTop: '2px',
              }}>
                Football Management System
              </p>
            </div>
          </div>

          {/* Desktop Nav */}
          <nav style={{ display: 'flex', alignItems: 'center', gap: '4px' }} className="desktop-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '8px 16px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '0.85rem',
                  fontWeight: 600,
                  transition: 'all 0.2s ease',
                  color: isActive ? '#e94560' : '#a0a0a0',
                  background: isActive ? 'rgba(233, 69, 96, 0.1)' : 'transparent',
                })}
              >
                <item.icon size={16} />
                <span>{item.label}</span>
              </NavLink>
            ))}
          </nav>

          {/* Auth + Mobile Menu */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
            {manager && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ 
                  fontSize: '0.8rem', 
                  color: '#a0a0a0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#3b82f6',
                  }} />
                  {manager.username}
                  <span style={{
                    background: 'rgba(59, 130, 246, 0.2)',
                    color: '#3b82f6',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontSize: '0.65rem',
                    fontWeight: 700,
                    textTransform: 'uppercase',
                  }}>
                    Manager
                  </span>
                </span>
                <button
                  onClick={handleManagerLogout}
                  className="crf-btn crf-btn-sm"
                  style={{ background: 'rgba(59, 130, 246, 0.2)', color: '#3b82f6' }}
                >
                  <LogOut size={14} />
                  Logout
                </button>
              </div>
            )}

            {user && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span style={{ 
                  fontSize: '0.8rem', 
                  color: '#a0a0a0',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                }}>
                  <div style={{
                    width: '8px',
                    height: '8px',
                    borderRadius: '50%',
                    background: '#22c55e',
                  }} />
                  {user.email}
                  {isAdmin && (
                    <span style={{
                      background: 'rgba(233, 69, 96, 0.2)',
                      color: '#e94560',
                      padding: '2px 8px',
                      borderRadius: '4px',
                      fontSize: '0.65rem',
                      fontWeight: 700,
                      textTransform: 'uppercase',
                    }}>
                      Admin
                    </span>
                  )}
                </span>
                <button
                  onClick={handleSignOut}
                  className="crf-btn crf-btn-sm crf-btn-danger"
                >
                  <LogOut size={14} />
                  Sign Out
                </button>
              </div>
            )}

            {!user && !manager && (
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <button
                  onClick={() => setShowManagerLogin(true)}
                  className="crf-btn"
                  style={{ 
                    background: 'rgba(59, 130, 246, 0.2)', 
                    color: '#3b82f6',
                    padding: '8px 14px',
                    fontSize: '0.8rem'
                  }}
                >
                  <Briefcase size={14} />
                  Manager Login
                </button>
                <button
                  onClick={() => setShowLogin(true)}
                  className="crf-btn crf-btn-primary"
                  style={{ padding: '8px 14px', fontSize: '0.8rem' }}
                >
                  <LogIn size={14} />
                  Admin Login
                </button>
              </div>
            )}

            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="mobile-menu-btn"
              style={{
                display: 'none',
                background: 'none',
                border: 'none',
                color: 'white',
                cursor: 'pointer',
                padding: '8px',
              }}
            >
              {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
            </button>
          </div>
        </div>

        {/* Mobile Menu */}
        {mobileMenuOpen && (
          <div style={{
            display: 'none',
            borderTop: '1px solid #2a2a4a',
            padding: '16px',
            background: '#1a1a2e',
          }} className="mobile-nav">
            {navItems.map((item) => (
              <NavLink
                key={item.path}
                to={item.path}
                onClick={() => setMobileMenuOpen(false)}
                style={({ isActive }) => ({
                  display: 'flex',
                  alignItems: 'center',
                  gap: '12px',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  textDecoration: 'none',
                  fontSize: '0.9rem',
                  fontWeight: 600,
                  color: isActive ? '#e94560' : '#a0a0a0',
                  background: isActive ? 'rgba(233, 69, 96, 0.1)' : 'transparent',
                  marginBottom: '4px',
                })}
              >
                <item.icon size={18} />
                <span>{item.label}</span>
                <ChevronRight size={16} style={{ marginLeft: 'auto' }} />
              </NavLink>
            ))}
            {!user && !manager && (
              <>
                <button
                  onClick={() => { setShowManagerLogin(true); setMobileMenuOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#3b82f6',
                    background: 'rgba(59, 130, 246, 0.1)',
                    marginBottom: '4px',
                    width: '100%',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <Briefcase size={18} />
                  <span>Manager Login</span>
                </button>
                <button
                  onClick={() => { setShowLogin(true); setMobileMenuOpen(false); }}
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '12px',
                    padding: '12px 16px',
                    borderRadius: '8px',
                    textDecoration: 'none',
                    fontSize: '0.9rem',
                    fontWeight: 600,
                    color: '#e94560',
                    background: 'rgba(233, 69, 96, 0.1)',
                    width: '100%',
                    border: 'none',
                    cursor: 'pointer',
                  }}
                >
                  <LogIn size={18} />
                  <span>Admin Login</span>
                </button>
              </>
            )}
          </div>
        )}
      </header>

      {/* Main Content */}
      <main style={{ flex: 1, padding: '24px' }}>
        <div style={{ maxWidth: '1400px', margin: '0 auto' }}>
          <Routes>
            <Route path="/" element={<MasterSheet />} />
            <Route path="/clubs" element={<ClubRosters />} />
            <Route path="/leaderboards" element={<Leaderboards />} />
            <Route path="/standings" element={<Standings />} />
            <Route path="/competitions" element={<Competitions />} />
            <Route path="/transfers" element={<TransferListings />} />
            <Route path="/player-sheet" element={<PlayerSheet />} />
            <Route path="/admin" element={<AdminPanel />} />
            <Route path="/manager" element={<ManagerDashboard />} />
          </Routes>
        </div>
      </main>

      {/* Footer */}
      <footer style={{
        background: '#1a1a2e',
        borderTop: '1px solid #2a2a4a',
        padding: '20px 24px',
        textAlign: 'center',
      }}>
        <p style={{ color: '#a0a0a0', fontSize: '0.8rem' }}>
          CRF League Management System. Built for professional Roblox football leagues.
        </p>
      </footer>

      {/* Modals */}
      {showLogin && <LoginModal onClose={() => setShowLogin(false)} />}
      {showManagerLogin && <ManagerLoginModal onClose={() => setShowManagerLogin(false)} />}

      <style>{`
        @media (max-width: 1024px) {
          .desktop-nav { display: none !important; }
          .mobile-menu-btn { display: block !important; }
          .mobile-nav { display: block !important; }
        }
      `}</style>
    </div>
  )
}

function App() {
  return (
    <ManagerAuthProvider>
      <AppContent />
    </ManagerAuthProvider>
  )
}

export default App
