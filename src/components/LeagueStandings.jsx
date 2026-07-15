import React, { useState, useMemo } from 'react'
import { Trophy, ArrowUp, ArrowDown, Minus, Shield } from 'lucide-react'

const LeagueStandings = ({ 
  title, 
  logo, 
  teams,
  themeColor = '#e94560',
  accentColor = '#ffd700',
  uclSpots = 8,
  uelSpots = 8,
}) => {
  const [sortBy, setSortBy] = useState('points')
  const [sortDir, setSortDir] = useState('desc')

  // Calculate derived stats for each team
  const teamsWithStats = useMemo(() => {
    return teams.map(team => {
      const played = (team.wins || 0) + (team.draws || 0) + (team.losses || 0)
      const points = (team.wins || 0) * 3 + (team.draws || 0)
      const gd = (team.goals_for || 0) - (team.goals_against || 0)
      return {
        ...team,
        played,
        points,
        gd,
      }
    })
  }, [teams])

  // Sort teams
  const sortedTeams = useMemo(() => {
    const sorted = [...teamsWithStats].sort((a, b) => {
      let valA = a[sortBy]
      let valB = b[sortBy]

      // Primary sort by points, then GD, then GF
      if (sortBy === 'points') {
        if (b.points !== a.points) return b.points - a.points
        if (b.gd !== a.gd) return b.gd - a.gd
        return (b.goals_for || 0) - (a.goals_for || 0)
      }

      if (sortDir === 'asc') return valA - valB
      return valB - valA
    })
    return sorted
  }, [teamsWithStats, sortBy, sortDir])

  const getPositionStyle = (index) => {
    if (index < uclSpots) {
      // UCL spots - blue/purple gradient
      return {
        background: 'linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(139, 92, 246, 0.1))',
        borderLeft: '3px solid #3b82f6',
      }
    }
    if (index < uclSpots + uelSpots) {
      // UEL spots - orange gradient
      return {
        background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.15), rgba(245, 158, 11, 0.1))',
        borderLeft: '3px solid #f97316',
      }
    }
    return {
      background: 'transparent',
      borderLeft: '3px solid transparent',
    }
  }

  const getPositionBadge = (index) => {
    if (index === 0) return { icon: Trophy, color: '#ffd700', label: '1st' }
    if (index === 1) return { icon: Trophy, color: '#c0c0c0', label: '2nd' }
    if (index === 2) return { icon: Trophy, color: '#cd7f32', label: '3rd' }
    if (index < uclSpots) return { icon: Shield, color: '#3b82f6', label: 'UCL' }
    if (index < uclSpots + uelSpots) return { icon: Shield, color: '#f97316', label: 'UEL' }
    return null
  }

  const handleSort = (field) => {
    if (sortBy === field) {
      setSortDir(sortDir === 'asc' ? 'desc' : 'asc')
    } else {
      setSortBy(field)
      setSortDir('desc')
    }
  }

  const SortIcon = ({ field }) => {
    if (sortBy !== field) return <Minus size={12} style={{ opacity: 0.3 }} />
    return sortDir === 'desc' ? <ArrowDown size={12} /> : <ArrowUp size={12} />
  }

  return (
    <div style={{
      background: 'var(--crf-card)',
      borderRadius: '16px',
      border: `1px solid ${themeColor}40`,
      overflow: 'hidden',
      marginBottom: '32px',
    }}>
      {/* Header */}
      <div style={{
        background: `linear-gradient(135deg, ${themeColor}20 0%, ${themeColor}10 100%)`,
        padding: '20px 24px',
        display: 'flex',
        alignItems: 'center',
        gap: '16px',
        borderBottom: `1px solid ${themeColor}30`,
      }}>
        {logo && (
          <img 
            src={logo} 
            alt={title}
            style={{
              width: '48px',
              height: '48px',
              objectFit: 'contain',
              filter: 'drop-shadow(0 2px 8px rgba(0,0,0,0.3))',
            }}
          />
        )}
        <div>
          <h2 style={{
            fontFamily: 'Oswald, sans-serif',
            fontSize: '1.5rem',
            fontWeight: 700,
            color: 'white',
            letterSpacing: '0.05em',
            margin: 0,
          }}>
            {title}
          </h2>
          <p style={{
            fontSize: '0.8rem',
            color: 'var(--crf-text-muted)',
            margin: '4px 0 0 0',
          }}>
            League Standings
          </p>
        </div>
        <Trophy size={24} style={{ 
          color: accentColor, 
          marginLeft: 'auto',
          filter: 'drop-shadow(0 0 8px ' + accentColor + '40)',
        }} />
      </div>

      {/* Legend */}
      <div style={{
        display: 'flex',
        gap: '20px',
        padding: '12px 24px',
        borderBottom: '1px solid var(--crf-border)',
        flexWrap: 'wrap',
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#3b82f6' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--crf-text-muted)' }}>UCL Qualification (Top {uclSpots})</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px' }}>
          <div style={{ width: '12px', height: '12px', borderRadius: '3px', background: '#f97316' }} />
          <span style={{ fontSize: '0.75rem', color: 'var(--crf-text-muted)' }}>UEL Qualification ({uclSpots + 1}-{uclSpots + uelSpots})</span>
        </div>
      </div>

      {/* Standings Table */}
      <div style={{ overflowX: 'auto' }}>
        <table style={{
          width: '100%',
          borderCollapse: 'collapse',
          fontSize: '0.875rem',
        }}>
          <thead>
            <tr style={{
              background: 'var(--crf-accent)',
            }}>
              <th style={{ padding: '14px 16px', textAlign: 'center', fontFamily: 'Oswald, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', width: '50px' }}>#</th>
              <th style={{ padding: '14px 16px', textAlign: 'left', fontFamily: 'Oswald, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem' }}>Club</th>
              <th 
                onClick={() => handleSort('played')}
                style={{ padding: '14px 16px', textAlign: 'center', fontFamily: 'Oswald, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  P <SortIcon field="played" />
                </span>
              </th>
              <th 
                onClick={() => handleSort('wins')}
                style={{ padding: '14px 16px', textAlign: 'center', fontFamily: 'Oswald, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  W <SortIcon field="wins" />
                </span>
              </th>
              <th 
                onClick={() => handleSort('draws')}
                style={{ padding: '14px 16px', textAlign: 'center', fontFamily: 'Oswald, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  D <SortIcon field="draws" />
                </span>
              </th>
              <th 
                onClick={() => handleSort('losses')}
                style={{ padding: '14px 16px', textAlign: 'center', fontFamily: 'Oswald, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  L <SortIcon field="losses" />
                </span>
              </th>
              <th 
                onClick={() => handleSort('goals_for')}
                style={{ padding: '14px 16px', textAlign: 'center', fontFamily: 'Oswald, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  GF <SortIcon field="goals_for" />
                </span>
              </th>
              <th 
                onClick={() => handleSort('goals_against')}
                style={{ padding: '14px 16px', textAlign: 'center', fontFamily: 'Oswald, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  GA <SortIcon field="goals_against" />
                </span>
              </th>
              <th 
                onClick={() => handleSort('gd')}
                style={{ padding: '14px 16px', textAlign: 'center', fontFamily: 'Oswald, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  GD <SortIcon field="gd" />
                </span>
              </th>
              <th 
                onClick={() => handleSort('points')}
                style={{ padding: '14px 16px', textAlign: 'center', fontFamily: 'Oswald, sans-serif', fontWeight: 600, textTransform: 'uppercase', letterSpacing: '0.05em', fontSize: '0.75rem', cursor: 'pointer', userSelect: 'none', whiteSpace: 'nowrap' }}
              >
                <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '4px' }}>
                  PTS <SortIcon field="points" />
                </span>
              </th>
            </tr>
          </thead>
          <tbody>
            {sortedTeams.length === 0 ? (
              <tr>
                <td colSpan="10" style={{ textAlign: 'center', padding: '60px', color: 'var(--crf-text-muted)' }}>
                  <Shield size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
                  <p>No teams in this league yet.</p>
                </td>
              </tr>
            ) : (
              sortedTeams.map((team, index) => {
                const posStyle = getPositionStyle(index)
                const badge = getPositionBadge(index)
                const isPositiveGD = team.gd > 0
                const isNegativeGD = team.gd < 0

                return (
                  <tr 
                    key={team.id || index}
                    style={{
                      transition: 'all 0.2s ease',
                      borderBottom: '1px solid var(--crf-border)',
                      ...posStyle,
                    }}
                    onMouseEnter={(e) => {
                      e.currentTarget.style.background = 'rgba(255,255,255,0.04)'
                    }}
                    onMouseLeave={(e) => {
                      Object.assign(e.currentTarget.style, posStyle)
                    }}
                  >
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '6px' }}>
                        <span style={{
                          fontWeight: 800,
                          fontFamily: 'Oswald, sans-serif',
                          fontSize: '1rem',
                          color: index < 3 ? accentColor : 'var(--crf-text)',
                        }}>
                          {index + 1}
                        </span>
                        {badge && (
                          <badge.icon size={14} style={{ color: badge.color }} />
                        )}
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        {team.logo && (
                          <img 
                            src={team.logo} 
                            alt=""
                            style={{ width: '28px', height: '28px', objectFit: 'contain' }}
                          />
                        )}
                        <div>
                          <span style={{ fontWeight: 700, fontSize: '0.9rem' }}>{team.name}</span>
                          {team.short_name && (
                            <span style={{ fontSize: '0.7rem', color: 'var(--crf-text-muted)', marginLeft: '8px' }}>
                              {team.short_name}
                            </span>
                          )}
                        </div>
                      </div>
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--crf-text-muted)' }}>
                      {team.played}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: '#22c55e' }}>
                      {team.wins || 0}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600, color: 'var(--crf-text-muted)' }}>
                      {team.draws || 0}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 700, color: '#ef4444' }}>
                      {team.losses || 0}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600 }}>
                      {team.goals_for || 0}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center', fontWeight: 600 }}>
                      {team.goals_against || 0}
                    </td>
                    <td style={{ 
                      padding: '14px 16px', 
                      textAlign: 'center', 
                      fontWeight: 700,
                      color: isPositiveGD ? '#22c55e' : isNegativeGD ? '#ef4444' : 'var(--crf-text-muted)',
                    }}>
                      {team.gd > 0 ? '+' : ''}{team.gd}
                    </td>
                    <td style={{ padding: '14px 16px', textAlign: 'center' }}>
                      <span style={{
                        fontWeight: 800,
                        fontFamily: 'Oswald, sans-serif',
                        fontSize: '1.1rem',
                        color: index < 3 ? accentColor : 'white',
                      }}>
                        {team.points}
                      </span>
                    </td>
                  </tr>
                )
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  )
}

export default LeagueStandings
