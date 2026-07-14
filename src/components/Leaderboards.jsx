import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../hooks/useSupabase'
import { Trophy, Medal, Target, Shield, Footprints, AlertTriangle, Ban } from 'lucide-react'

const LEADERBOARD_CATEGORIES = [
  { key: 'goals', label: 'Top Goalscorers', icon: Target, color: '#22c55e' },
  { key: 'assists', label: 'Top Assists', icon: Footprints, color: '#3b82f6' },
  { key: 'tackles', label: 'Most Tackles', icon: Shield, color: '#8b5cf6' },
  { key: 'saves', label: 'Most Saves', icon: Shield, color: '#f59e0b' },
  { key: 'yellow_cards', label: 'Most Yellow Cards', icon: AlertTriangle, color: '#eab308' },
  { key: 'red_cards', label: 'Most Red Cards', icon: Ban, color: '#ef4444' },
]

function Leaderboards() {
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [activeTab, setActiveTab] = useState('goals')

  const fetchPlayers = useCallback(async () => {
    setLoading(true)
    const { data } = await supabase.from('players').select('*')
    setPlayers(data || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchPlayers()
    const subscription = supabase
      .channel('leaderboard_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, fetchPlayers)
      .subscribe()
    return () => subscription.unsubscribe()
  }, [fetchPlayers])

  const getLeaderboard = (key) => {
    return [...players]
      .filter(p => p[key] > 0)
      .sort((a, b) => b[key] - a[key])
      .slice(0, 10)
  }

  const activeCategory = LEADERBOARD_CATEGORIES.find(c => c.key === activeTab)
  const leaderboard = getLeaderboard(activeTab)

  return (
    <div className="animate-fade-in">
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '4px' }}>
          Leaderboards
        </h2>
        <p style={{ color: '#a0a0a0', fontSize: '0.875rem' }}>
          Top performers across all categories · Auto-updates from Master Sheet
        </p>
      </div>

      {/* Tabs */}
      <div style={{
        display: 'flex',
        gap: '4px',
        marginBottom: '24px',
        overflowX: 'auto',
        paddingBottom: '8px',
      }}>
        {LEADERBOARD_CATEGORIES.map(cat => {
          const Icon = cat.icon
          const isActive = activeTab === cat.key
          return (
            <button
              key={cat.key}
              onClick={() => setActiveTab(cat.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.85rem',
                whiteSpace: 'nowrap',
                transition: 'all 0.2s',
                background: isActive ? `rgba(${cat.color === '#22c55e' ? '34,197,94' : cat.color === '#3b82f6' ? '59,130,246' : cat.color === '#8b5cf6' ? '139,92,246' : cat.color === '#f59e0b' ? '245,158,11' : cat.color === '#eab308' ? '234,179,8' : '239,68,68'}, 0.15)` : 'transparent',
                color: isActive ? cat.color : '#a0a0a0',
              }}
            >
              <Icon size={16} />
              {cat.label}
            </button>
          )
        })}
      </div>

      {/* Leaderboard Content */}
      {loading ? (
        <div className="crf-card">
          <div className="skeleton" style={{ height: '400px' }} />
        </div>
      ) : leaderboard.length === 0 ? (
        <div className="crf-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <Trophy size={48} style={{ margin: '0 auto 16px', opacity: 0.3, color: '#a0a0a0' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No Data Yet</h3>
          <p style={{ color: '#a0a0a0' }}>Add players and their stats to see leaderboards.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '12px' }}>
          {leaderboard.map((player, index) => (
            <div
              key={player.id}
              className="crf-card"
              style={{
                padding: '16px 20px',
                display: 'flex',
                alignItems: 'center',
                gap: '16px',
                borderLeft: index < 3 ? `4px solid ${index === 0 ? '#ffd700' : index === 1 ? '#c0c0c0' : '#cd7f32'}` : '4px solid transparent',
              }}
            >
              {/* Rank */}
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '50%',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontWeight: 800,
                fontSize: '1rem',
                fontFamily: 'Oswald, sans-serif',
                ...(index === 0 ? { background: 'linear-gradient(135deg, #ffd700, #ffaa00)', color: '#1a1a2e' } :
                  index === 1 ? { background: 'linear-gradient(135deg, #c0c0c0, #a0a0a0)', color: '#1a1a2e' } :
                  index === 2 ? { background: 'linear-gradient(135deg, #cd7f32, #b87333)', color: 'white' } :
                  { background: 'rgba(255,255,255,0.05)', color: '#a0a0a0' })
              }}>
                {index < 3 ? <Medal size={20} /> : index + 1}
              </div>

              {/* Avatar */}
              <img
                src={player.roblox_avatar_url || `https://placehold.co/48x48/1e1e3f/666?text=${player.roblox_username?.charAt(0)}`}
                alt={player.roblox_username}
                style={{
                  width: '48px',
                  height: '48px',
                  borderRadius: '10px',
                  objectFit: 'cover',
                  border: '2px solid #2a2a4a',
                }}
                onError={(e) => {
                  e.target.src = `https://placehold.co/48x48/1e1e3f/666?text=${player.roblox_username?.charAt(0)}`
                }}
              />

              {/* Info */}
              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{
                  fontWeight: 700,
                  fontSize: '1rem',
                  marginBottom: '2px',
                  whiteSpace: 'nowrap',
                  overflow: 'hidden',
                  textOverflow: 'ellipsis',
                }}>
                  {player.roblox_username}
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', fontSize: '0.8rem', color: '#a0a0a0' }}>
                  <span style={{
                    background: 'rgba(233, 69, 96, 0.1)',
                    color: '#e94560',
                    padding: '2px 8px',
                    borderRadius: '4px',
                    fontWeight: 600,
                  }}>
                    {player.club || 'Free Agent'}
                  </span>
                  <span>{player.position}</span>
                </div>
              </div>

              {/* Stat */}
              <div style={{
                textAlign: 'center',
                minWidth: '80px',
              }}>
                <div style={{
                  fontSize: '1.8rem',
                  fontWeight: 800,
                  fontFamily: 'Oswald, sans-serif',
                  color: activeCategory?.color || '#e94560',
                  lineHeight: 1,
                }}>
                  {player[activeTab]}
                </div>
                <div style={{
                  fontSize: '0.7rem',
                  color: '#a0a0a0',
                  textTransform: 'uppercase',
                  letterSpacing: '0.1em',
                }}>
                  {activeCategory?.label.split(' ').slice(1).join(' ')}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default Leaderboards
