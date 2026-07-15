import React, { useState, useEffect } from 'react'
import { supabase } from '../hooks/useSupabase'
import { 
  Trophy, 
  Shield, 
  Plus, 
  Trash2, 
  Save, 
  Loader2,
  AlertCircle,
  CheckCircle2,
  ArrowUp,
  ArrowDown
} from 'lucide-react'

const AdminStandingsManager = () => {
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [message, setMessage] = useState(null)
  const [activeLeague, setActiveLeague] = useState('premier_league')

  const leagues = [
    { key: 'premier_league', label: 'Premier League', icon: Shield },
    { key: 'serie_a', label: 'Serie A', icon: Trophy },
  ]

  useEffect(() => {
    fetchTeams()
  }, [activeLeague])

  const fetchTeams = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('standings')
        .select('*')
        .eq('league', activeLeague)
        .order('created_at', { ascending: true })

      if (error) throw error
      setTeams(data || [])
    } catch (err) {
      console.error('Error fetching standings:', err)
      setTeams([])
    } finally {
      setLoading(false)
    }
  }

  const addTeam = () => {
    const newTeam = {
      id: `temp_${Date.now()}`,
      league: activeLeague,
      name: '',
      short_name: '',
      logo: '',
      wins: 0,
      draws: 0,
      losses: 0,
      goals_for: 0,
      goals_against: 0,
      isNew: true,
    }
    setTeams([...teams, newTeam])
  }

  const updateTeam = (id, field, value) => {
    setTeams(teams.map(t => 
      t.id === id ? { ...t, [field]: value } : m
    ))
  }

  const deleteTeam = async (id) => {
    if (!window.confirm('Are you sure you want to remove this team from the standings?')) return

    const team = teams.find(t => t.id === id)
    if (team?.isNew) {
      setTeams(teams.filter(t => t.id !== id))
      return
    }

    try {
      const { error } = await supabase
        .from('standings')
        .delete()
        .eq('id', id)

      if (error) throw error
      setTeams(teams.filter(t => t.id !== id))
      showMessage('Team removed successfully', 'success')
    } catch (err) {
      console.error('Error deleting team:', err)
      showMessage('Failed to remove team', 'error')
    }
  }

  const saveTeams = async () => {
    setSaving(true)
    try {
      const newTeams = teams.filter(t => t.isNew)
      const existingTeams = teams.filter(t => !t.isNew)

      // Insert new teams
      if (newTeams.length > 0) {
        const insertData = newTeams.map(t => {
          const { id, isNew, ...rest } = t
          return rest
        })

        const { error: insertError } = await supabase
          .from('standings')
          .insert(insertData)

        if (insertError) throw insertError
      }

      // Update existing teams
      for (const team of existingTeams) {
        const { error: updateError } = await supabase
          .from('standings')
          .update({
            name: team.name,
            short_name: team.short_name,
            logo: team.logo,
            wins: team.wins,
            draws: team.draws,
            losses: team.losses,
            goals_for: team.goals_for,
            goals_against: team.goals_against,
          })
          .eq('id', team.id)

        if (updateError) throw updateError
      }

      showMessage('All standings saved successfully!', 'success')
      await fetchTeams()
    } catch (err) {
      console.error('Error saving standings:', err)
      showMessage('Failed to save standings: ' + err.message, 'error')
    } finally {
      setSaving(false)
    }
  }

  const showMessage = (text, type) => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 4000)
  }

  // Calculate preview stats
  const getPreviewStats = (team) => {
    const played = (team.wins || 0) + (team.draws || 0) + (team.losses || 0)
    const points = (team.wins || 0) * 3 + (team.draws || 0)
    const gd = (team.goals_for || 0) - (team.goals_against || 0)
    return { played, points, gd }
  }

  // Sort teams for preview
  const sortedPreview = [...teams].sort((a, b) => {
    const statsA = getPreviewStats(a)
    const statsB = getPreviewStats(b)
    if (statsB.points !== statsA.points) return statsB.points - statsA.points
    if (statsB.gd !== statsA.gd) return statsB.gd - statsA.gd
    return (b.goals_for || 0) - (a.goals_for || 0)
  })

  return (
    <div className="animate-fade-in">
      {/* Header */}
      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ 
          fontSize: '1.5rem', 
          fontWeight: 700, 
          margin: '0 0 8px 0',
          fontFamily: 'Oswald, sans-serif',
        }}>
          League Standings Manager
        </h2>
        <p style={{ color: 'var(--crf-text-muted)', fontSize: '0.85rem', margin: 0 }}>
          Add, edit, and manage league table entries. Points and GD auto-calculate.
        </p>
      </div>

      {/* Message */}
      {message && (
        <div style={{
          position: 'fixed',
          top: '80px',
          right: '24px',
          zIndex: 1000,
          padding: '16px 20px',
          borderRadius: '8px',
          display: 'flex',
          alignItems: 'center',
          gap: '10px',
          fontWeight: 600,
          fontSize: '0.875rem',
          animation: 'slideIn 0.3s ease-out',
          background: message.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
          border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
          color: message.type === 'error' ? '#ef4444' : '#22c55e',
        }}>
          {message.type === 'error' ? <AlertCircle size={18} /> : <CheckCircle2 size={18} />}
          {message.text}
        </div>
      )}

      {/* League Tabs */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '20px',
        flexWrap: 'wrap',
      }}>
        {leagues.map((league) => {
          const Icon = league.icon
          const isActive = activeLeague === league.key
          return (
            <button
              key={league.key}
              onClick={() => setActiveLeague(league.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '10px 18px',
                borderRadius: '10px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.85rem',
                fontWeight: 600,
                background: isActive ? 'rgba(233, 69, 96, 0.2)' : 'rgba(255,255,255,0.03)',
                color: isActive ? '#e94560' : 'var(--crf-text-muted)',
                borderBottom: isActive ? '2px solid #e94560' : '2px solid transparent',
                transition: 'all 0.2s ease',
              }}
            >
              <Icon size={16} />
              <span>{league.label}</span>
            </button>
          )
        })}
      </div>

      {/* Actions */}
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '20px',
      }}>
        <span style={{ color: 'var(--crf-text-muted)', fontSize: '0.85rem' }}>
          {teams.length} team{teams.length !== 1 ? 's' : ''} in this league
        </span>
        <div style={{ display: 'flex', gap: '10px' }}>
          <button
            onClick={addTeam}
            className="crf-btn crf-btn-primary"
            style={{ padding: '8px 16px', fontSize: '0.8rem' }}
          >
            <Plus size={16} />
            Add Team
          </button>
          <button
            onClick={saveTeams}
            disabled={saving}
            className="crf-btn"
            style={{
              padding: '8px 16px',
              fontSize: '0.8rem',
              background: 'rgba(34, 197, 94, 0.2)',
              color: '#22c55e',
              cursor: saving ? 'not-allowed' : 'pointer',
              opacity: saving ? 0.6 : 1,
            }}
          >
            {saving ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Save size={16} />}
            Save All
          </button>
        </div>
      </div>

      {/* Live Preview */}
      {teams.length > 0 && (
        <div style={{
          background: 'var(--crf-card)',
          border: '1px solid var(--crf-border)',
          borderRadius: '12px',
          padding: '16px 20px',
          marginBottom: '20px',
        }}>
          <h4 style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--crf-text-muted)', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>
            Live Preview (Auto-sorted)
          </h4>
          <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px' }}>
            {sortedPreview.map((team, idx) => {
              const stats = getPreviewStats(team)
              let color = 'var(--crf-text-muted)'
              if (idx < 8) color = '#3b82f6'
              if (idx < 3) color = '#ffd700'
              if (idx >= 8 && idx < 16) color = '#f97316'

              return (
                <div key={team.id} style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  padding: '6px 12px',
                  borderRadius: '6px',
                  background: 'rgba(255,255,255,0.03)',
                  border: `1px solid ${color}30`,
                }}>
                  <span style={{ fontWeight: 800, fontFamily: 'Oswald, sans-serif', fontSize: '0.8rem', color }}>
                    {idx + 1}
                  </span>
                  <span style={{ fontSize: '0.75rem', fontWeight: 600, color: 'var(--crf-text)' }}>
                    {team.name || 'New Team'}
                  </span>
                  <span style={{ fontSize: '0.7rem', color: 'var(--crf-text-muted)' }}>
                    ({stats.points}pts)
                  </span>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {/* Teams Table */}
      {loading ? (
        <div style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '60px',
        }}>
          <Loader2 size={32} style={{ color: 'var(--crf-gold)', animation: 'spin 1s linear infinite' }} />
        </div>
      ) : teams.length === 0 ? (
        <div className="crf-card" style={{
          textAlign: 'center',
          padding: '60px',
          color: 'var(--crf-text-muted)',
        }}>
          <Shield size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
          <p>No teams in this league yet. Click "Add Team" to get started.</p>
        </div>
      ) : (
        <div style={{
          background: 'var(--crf-card)',
          border: '1px solid var(--crf-border)',
          borderRadius: '12px',
          overflow: 'hidden',
        }}>
          <div style={{ overflowX: 'auto' }}>
            <table className="crf-table">
              <thead>
                <tr>
                  <th style={{ width: '40px' }}>#</th>
                  <th>Club Name</th>
                  <th>Short</th>
                  <th style={{ textAlign: 'center' }}>W</th>
                  <th style={{ textAlign: 'center' }}>D</th>
                  <th style={{ textAlign: 'center' }}>L</th>
                  <th style={{ textAlign: 'center' }}>GF</th>
                  <th style={{ textAlign: 'center' }}>GA</th>
                  <th style={{ textAlign: 'center' }}>Preview</th>
                  <th style={{ textAlign: 'center' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teams.map((team, index) => {
                  const preview = getPreviewStats(team)
                  return (
                    <tr key={team.id}>
                      <td style={{ fontWeight: 600, color: 'var(--crf-text-muted)' }}>
                        {index + 1}
                      </td>
                      <td>
                        <input
                          type="text"
                          value={team.name || ''}
                          onChange={(e) => updateTeam(team.id, 'name', e.target.value)}
                          placeholder="Club Name"
                          className="crf-input"
                          style={{ minWidth: '160px', padding: '8px 10px', fontSize: '0.85rem' }}
                        />
                      </td>
                      <td>
                        <input
                          type="text"
                          value={team.short_name || ''}
                          onChange={(e) => updateTeam(team.id, 'short_name', e.target.value)}
                          placeholder="Short"
                          className="crf-input"
                          style={{ width: '80px', padding: '8px 10px', fontSize: '0.8rem' }}
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="number"
                          value={team.wins || 0}
                          onChange={(e) => updateTeam(team.id, 'wins', parseInt(e.target.value) || 0)}
                          className="crf-input"
                          style={{ width: '55px', padding: '8px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: '#22c55e' }}
                          min="0"
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="number"
                          value={team.draws || 0}
                          onChange={(e) => updateTeam(team.id, 'draws', parseInt(e.target.value) || 0)}
                          className="crf-input"
                          style={{ width: '55px', padding: '8px', textAlign: 'center', fontSize: '0.85rem' }}
                          min="0"
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="number"
                          value={team.losses || 0}
                          onChange={(e) => updateTeam(team.id, 'losses', parseInt(e.target.value) || 0)}
                          className="crf-input"
                          style={{ width: '55px', padding: '8px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 700, color: '#ef4444' }}
                          min="0"
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="number"
                          value={team.goals_for || 0}
                          onChange={(e) => updateTeam(team.id, 'goals_for', parseInt(e.target.value) || 0)}
                          className="crf-input"
                          style={{ width: '55px', padding: '8px', textAlign: 'center', fontSize: '0.85rem' }}
                          min="0"
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <input
                          type="number"
                          value={team.goals_against || 0}
                          onChange={(e) => updateTeam(team.id, 'goals_against', parseInt(e.target.value) || 0)}
                          className="crf-input"
                          style={{ width: '55px', padding: '8px', textAlign: 'center', fontSize: '0.85rem' }}
                          min="0"
                        />
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <div style={{
                          display: 'flex',
                          flexDirection: 'column',
                          alignItems: 'center',
                          gap: '2px',
                        }}>
                          <span style={{ fontWeight: 800, fontFamily: 'Oswald, sans-serif', fontSize: '0.9rem', color: '#e94560' }}>
                            {preview.points}
                          </span>
                          <span style={{ fontSize: '0.65rem', color: 'var(--crf-text-muted)' }}>
                            {preview.played}P · {preview.gd > 0 ? '+' : ''}{preview.gd}GD
                          </span>
                        </div>
                      </td>
                      <td style={{ textAlign: 'center' }}>
                        <button
                          onClick={() => deleteTeam(team.id)}
                          className="crf-btn crf-btn-sm crf-btn-danger"
                          style={{ padding: '6px' }}
                        >
                          <Trash2 size={14} />
                        </button>
                      </td>
                    </tr>
                  )
                })}
              </tbody>
            </table>
          </div>
        </div>
      )}
    </div>
  )
}

export default AdminStandingsManager
