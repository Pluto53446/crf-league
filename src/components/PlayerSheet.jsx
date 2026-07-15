import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../hooks/useSupabase'
import { useAuth } from '../hooks/useAuth'
import { 
  Search, 
  Plus, 
  Edit2, 
  Trash2, 
  Filter,
  X,
  Save,
  User,
  Shield,
  Globe,
  Trophy,
  AlertTriangle,
  ChevronUp,
  ChevronDown,
  Ban
} from 'lucide-react'

const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF']

const CLASSES = [
  { key: 'X', label: 'X Class', min: 90, max: 94, color: '#ef4444', bg: 'rgba(239, 68, 68, 0.15)' },
  { key: 'S', label: 'S Class', min: 85, max: 90, color: '#f59e0b', bg: 'rgba(245, 158, 11, 0.15)' },
  { key: 'A', label: 'A Class', min: 81, max: 85, color: '#22c55e', bg: 'rgba(34, 197, 94, 0.15)' },
  { key: 'B', label: 'B Class', min: 72, max: 80, color: '#3b82f6', bg: 'rgba(59, 130, 246, 0.15)' },
  { key: 'C', label: 'C Class', min: 66, max: 70, color: '#8b5cf6', bg: 'rgba(139, 92, 246, 0.15)' },
  { key: 'D', label: 'D Class', min: 60, max: 65, color: '#a0a0a0', bg: 'rgba(160, 160, 160, 0.15)' },
]

const LEAGUES = [
  'English Premier League',
  'La Liga',
  'Serie A',
  'Bundesliga',
  'Ligue 1',
  'Eredivisie',
  'Primeira Liga',
  'Scottish Premiership',
  'Championship',
  'MLS',
  'Brasileirão',
  'Argentine Primera División',
  'Liga MX',
  'J1 League',
  'K League 1',
  'Saudi Pro League',
  'Chinese Super League',
  'A-League',
  'Other'
]

const NATIONALITIES = [
  'Argentina', 'Australia', 'Belgium', 'Brazil', 'Canada', 'Colombia', 'Croatia', 
  'Denmark', 'England', 'France', 'Germany', 'Ghana', 'Italy', 'Japan', 'Mexico', 
  'Netherlands', 'Nigeria', 'Norway', 'Poland', 'Portugal', 'Scotland', 'South Korea', 
  'Spain', 'Sweden', 'Switzerland', 'United States', 'Uruguay', 'Wales', 'Other'
]

function PlayerSheet() {
  const [players, setPlayers] = useState([])
  const [clubs, setClubs] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [filterClass, setFilterClass] = useState('')
  const [filterLeague, setFilterLeague] = useState('')
  const [filterPosition, setFilterPosition] = useState('')
  const [filterNationality, setFilterNationality] = useState('')
  const [filterBanned, setFilterBanned] = useState('')
  const [showAddModal, setShowAddModal] = useState(false)
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [sortConfig, setSortConfig] = useState({ key: 'overall', direction: 'desc' })
  const { isAdmin } = useAuth()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: playersData }, { data: clubsData }] = await Promise.all([
      supabase.from('player_sheets').select('*').order('overall', { ascending: false }),
      supabase.from('clubs').select('*').order('name')
    ])
    setPlayers(playersData || [])
    setClubs(clubsData || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
    const subscription = supabase
      .channel('player_sheets_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'player_sheets' }, fetchData)
      .subscribe()
    return () => subscription.unsubscribe()
  }, [fetchData])

  const handleSort = (key) => {
    setSortConfig(prev => ({
      key,
      direction: prev.key === key && prev.direction === 'desc' ? 'asc' : 'desc'
    }))
  }

  const sortedPlayers = [...players].sort((a, b) => {
    if (!sortConfig.key) return 0
    const aVal = a[sortConfig.key] || 0
    const bVal = b[sortConfig.key] || 0
    return sortConfig.direction === 'desc' ? bVal - aVal : aVal - bVal
  })

  const filteredPlayers = sortedPlayers.filter(player => {
    const matchesSearch = player.roblox_username.toLowerCase().includes(searchQuery.toLowerCase()) ||
                         player.club?.toLowerCase().includes(searchQuery.toLowerCase())
    const matchesClass = !filterClass || player.player_class === filterClass
    const matchesLeague = !filterLeague || player.league === filterLeague
    const matchesPosition = !filterPosition || player.position === filterPosition
    const matchesNationality = !filterNationality || player.nationality === filterNationality
    const matchesBanned = filterBanned === '' || String(player.game_banned) === filterBanned
    return matchesSearch && matchesClass && matchesLeague && matchesPosition && matchesNationality && matchesBanned
  })

  const getRobloxData = async (username) => {
    const cleanUsername = username.replace(/^@/, '').trim()
    if (!cleanUsername) throw new Error('Please enter a Roblox username')

    try {
      const { data, error } = await supabase.functions.invoke('fetch-roblox-user', {
        body: { username: cleanUsername }
      })
      if (error) throw new Error(`Edge function error: ${error.message}`)
      if (data.error) throw new Error(data.error)
      return { userId: data.userId, username: data.username, avatarUrl: data.avatarUrl }
    } catch (err) {
      if (err.message.includes('not found')) throw err
      throw new Error(`Failed to fetch Roblox data: ${err.message}`)
    }
  }

  const handleAddPlayer = async (formData) => {
    try {
      const robloxData = await getRobloxData(formData.roblox_username)
      const overall = parseInt(formData.overall)

      if (overall < 60 || overall > 94) {
        throw new Error('Overall must be between 60 and 94')
      }

      const { error } = await supabase.from('player_sheets').insert([{
        roblox_username: robloxData.username,
        roblox_user_id: String(robloxData.userId),
        roblox_avatar_url: robloxData.avatarUrl,
        overall: overall,
        league: formData.league,
        nationality: formData.nationality,
        club: formData.club || null,
        position: formData.position,
        player_value: formData.player_value,
        game_banned: formData.game_banned === 'true',
      }])

      if (error) throw error
      setShowAddModal(false)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleEditPlayer = async (formData) => {
    try {
      const overall = parseInt(formData.overall)
      if (overall < 60 || overall > 94) {
        throw new Error('Overall must be between 60 and 94')
      }

      const updateData = {
        overall: overall,
        league: formData.league,
        nationality: formData.nationality,
        club: formData.club || null,
        position: formData.position,
        player_value: formData.player_value,
        game_banned: formData.game_banned === 'true',
      }

      if (formData.roblox_username !== editingPlayer.roblox_username) {
        const robloxData = await getRobloxData(formData.roblox_username)
        updateData.roblox_username = robloxData.username
        updateData.roblox_user_id = String(robloxData.userId)
        updateData.roblox_avatar_url = robloxData.avatarUrl
      }

      const { error } = await supabase.from('player_sheets').update(updateData).eq('id', editingPlayer.id)
      if (error) throw error
      setEditingPlayer(null)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleDeletePlayer = async (id) => {
    if (!confirm('Are you sure you want to delete this player sheet?')) return
    const { error } = await supabase.from('player_sheets').delete().eq('id', id)
    if (error) alert('Failed to delete player')
  }

  const getClassColor = (cls) => CLASSES.find(c => c.key === cls)?.color || '#a0a0a0'
  const getClassBg = (cls) => CLASSES.find(c => c.key === cls)?.bg || 'rgba(160, 160, 160, 0.15)'

  const SortIcon = ({ column }) => {
    if (sortConfig.key !== column) return <ChevronUp size={14} style={{ opacity: 0.3 }} />
    return sortConfig.direction === 'desc' 
      ? <ChevronDown size={14} style={{ color: '#e94560' }} />
      : <ChevronUp size={14} style={{ color: '#e94560' }} />
  }

  return (
    <div className="animate-fade-in">
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '4px' }}>Player Sheet</h2>
          <p style={{ color: '#a0a0a0', fontSize: '0.875rem' }}>{players.length} players · Auto-classified by overall rating</p>
        </div>
        {isAdmin && (
          <button onClick={() => setShowAddModal(true)} className="crf-btn crf-btn-primary">
            <Plus size={18} /> Add Player
          </button>
        )}
      </div>

      {/* Class Legend */}
      <div style={{ display: 'flex', gap: '8px', marginBottom: '20px', flexWrap: 'wrap' }}>
        {CLASSES.map(c => (
          <div key={c.key} style={{ display: 'flex', alignItems: 'center', gap: '6px', padding: '6px 12px', borderRadius: '6px', background: c.bg, border: `1px solid ${c.color}30` }}>
            <span style={{ fontWeight: 800, fontFamily: 'Oswald, sans-serif', color: c.color, fontSize: '0.9rem' }}>{c.key}</span>
            <span style={{ fontSize: '0.7rem', color: '#a0a0a0' }}>{c.min}-{c.max}</span>
          </div>
        ))}
      </div>

      {/* Filters */}
      <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
        <div style={{ position: 'relative', flex: 1, minWidth: '180px' }}>
          <Search size={16} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: '#a0a0a0' }} />
          <input type="text" placeholder="Search players..." value={searchQuery} onChange={(e) => setSearchQuery(e.target.value)} className="crf-input" style={{ paddingLeft: '38px', fontSize: '0.85rem' }} />
        </div>
        <select value={filterClass} onChange={(e) => setFilterClass(e.target.value)} className="crf-select" style={{ minWidth: '100px', fontSize: '0.85rem' }}>
          <option value="">All Classes</option>
          {CLASSES.map(c => <option key={c.key} value={c.key}>{c.key} Class</option>)}
        </select>
        <select value={filterLeague} onChange={(e) => setFilterLeague(e.target.value)} className="crf-select" style={{ minWidth: '140px', fontSize: '0.85rem' }}>
          <option value="">All Leagues</option>
          {LEAGUES.map(l => <option key={l} value={l}>{l}</option>)}
        </select>
        <select value={filterPosition} onChange={(e) => setFilterPosition(e.target.value)} className="crf-select" style={{ minWidth: '100px', fontSize: '0.85rem' }}>
          <option value="">All Positions</option>
          {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
        </select>
        <select value={filterNationality} onChange={(e) => setFilterNationality(e.target.value)} className="crf-select" style={{ minWidth: '120px', fontSize: '0.85rem' }}>
          <option value="">All Nations</option>
          {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
        </select>
        <select value={filterBanned} onChange={(e) => setFilterBanned(e.target.value)} className="crf-select" style={{ minWidth: '110px', fontSize: '0.85rem' }}>
          <option value="">All Status</option>
          <option value="true">Banned</option>
          <option value="false">Active</option>
        </select>
      </div>

      {/* Table */}
      <div style={{ background: '#1e1e3f', border: '1px solid #2a2a4a', borderRadius: '12px', overflow: 'hidden' }}>
        <div style={{ overflowX: 'auto' }}>
          <table className="crf-table">
            <thead>
              <tr>
                <th>Player</th>
                <th onClick={() => handleSort('overall')} style={{ cursor: 'pointer', userSelect: 'none' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>OVR <SortIcon column="overall" /></div>
                </th>
                <th>Class</th>
                <th>League</th>
                <th>Club</th>
                <th>Position</th>
                <th>Nationality</th>
                <th>Value</th>
                <th>Status</th>
                {isAdmin && <th>Actions</th>}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={isAdmin ? 10 : 9} style={{ textAlign: 'center', padding: '40px' }}><div className="skeleton" style={{ height: '20px', width: '200px', margin: '0 auto' }} /></td></tr>
              ) : filteredPlayers.length === 0 ? (
                <tr><td colSpan={isAdmin ? 10 : 9} style={{ textAlign: 'center', padding: '40px', color: '#a0a0a0' }}><User size={48} style={{ margin: '0 auto 12px', opacity: 0.3 }} /><p>No players found</p></td></tr>
              ) : (
                filteredPlayers.map(player => (
                  <tr key={player.id} style={player.game_banned ? { opacity: 0.5 } : {}}>
                    <td>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <img src={player.roblox_avatar_url || `https://placehold.co/40x40/1e1e3f/666?text=${player.roblox_username?.charAt(0)}`} alt={player.roblox_username} style={{ width: '40px', height: '40px', borderRadius: '8px', objectFit: 'cover', border: '2px solid #2a2a4a' }} onError={(e) => { e.target.src = `https://placehold.co/40x40/1e1e3f/666?text=${player.roblox_username?.charAt(0)}` }} />
                        <div>
                          <div style={{ fontWeight: 600 }}>{player.roblox_username}</div>
                          <div style={{ fontSize: '0.75rem', color: '#a0a0a0' }}>ID: {player.roblox_user_id}</div>
                        </div>
                      </div>
                    </td>
                    <td>
                      <span style={{ fontSize: '1.2rem', fontWeight: 800, fontFamily: 'Oswald, sans-serif', color: getClassColor(player.player_class) }}>
                        {player.overall}
                      </span>
                    </td>
                    <td>
                      <span style={{ background: getClassBg(player.player_class), color: getClassColor(player.player_class), padding: '4px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 800, fontFamily: 'Oswald, sans-serif' }}>
                        {player.player_class}
                      </span>
                    </td>
                    <td style={{ fontSize: '0.85rem' }}>{player.league}</td>
                    <td><span style={{ background: 'rgba(233, 69, 96, 0.1)', color: '#e94560', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 600 }}>{player.club || 'Free Agent'}</span></td>
                    <td><span style={{ background: 'rgba(15, 52, 96, 0.5)', padding: '4px 10px', borderRadius: '6px', fontSize: '0.8rem', fontWeight: 700 }}>{player.position}</span></td>
                    <td style={{ fontSize: '0.85rem', display: 'flex', alignItems: 'center', gap: '6px' }}><Globe size={14} />{player.nationality}</td>
                    <td style={{ fontWeight: 700, color: '#22c55e', fontSize: '0.9rem' }}>{player.player_value}</td>
                    <td>
                      {player.game_banned ? (
                        <span className="badge badge-red" style={{ display: 'flex', alignItems: 'center', gap: '4px' }}><Ban size={12} /> Banned</span>
                      ) : (
                        <span style={{ color: '#22c55e', fontSize: '0.8rem', fontWeight: 600 }}>Active</span>
                      )}
                    </td>
                    {isAdmin && (
                      <td>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button onClick={() => setEditingPlayer(player)} className="crf-btn crf-btn-sm crf-btn-secondary" style={{ padding: '6px' }}><Edit2 size={14} /></button>
                          <button onClick={() => handleDeletePlayer(player.id)} className="crf-btn crf-btn-sm crf-btn-danger" style={{ padding: '6px' }}><Trash2 size={14} /></button>
                        </div>
                      </td>
                    )}
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {(showAddModal || editingPlayer) && (
        <PlayerSheetModal
          player={editingPlayer}
          clubs={clubs}
          onClose={() => { setShowAddModal(false); setEditingPlayer(null) }}
          onSubmit={editingPlayer ? handleEditPlayer : handleAddPlayer}
        />
      )}
    </div>
  )
}

function PlayerSheetModal({ player, clubs, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    roblox_username: player?.roblox_username || '',
    overall: player?.overall || 75,
    league: player?.league || 'English Premier League',
    nationality: player?.nationality || 'England',
    club: player?.club || '',
    position: player?.position || 'ST',
    player_value: player?.player_value || '1M',
    game_banned: player?.game_banned ? 'true' : 'false',
  })
  const [submitting, setSubmitting] = useState(false)

  const handleChange = (e) => {
    const { name, value } = e.target
    setFormData(prev => ({ ...prev, [name]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()
    setSubmitting(true)
    await onSubmit(formData)
    setSubmitting(false)
  }

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-content" onClick={(e) => e.stopPropagation()}>
        <div style={{ padding: '24px', borderBottom: '1px solid #2a2a4a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{player ? 'Edit Player Sheet' : 'Add Player Sheet'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#a0a0a0', cursor: 'pointer' }}><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#a0a0a0' }}>Roblox Username *</label>
              <input type="text" name="roblox_username" value={formData.roblox_username} onChange={handleChange} className="crf-input" placeholder="Enter Roblox username" required disabled={!!player} />
              {!player && <p style={{ fontSize: '0.75rem', color: '#a0a0a0', marginTop: '4px' }}>Avatar and User ID will be fetched automatically.</p>}
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#a0a0a0' }}>Overall (60-94) *</label>
                <input type="number" name="overall" value={formData.overall} onChange={handleChange} className="crf-input" min="60" max="94" required />
                <p style={{ fontSize: '0.7rem', color: '#a0a0a0', marginTop: '4px' }}>Class auto-calculates: D(60-65) C(66-70) B(72-80) A(81-85) S(85-90) X(90-94)</p>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#a0a0a0' }}>Position *</label>
                <select name="position" value={formData.position} onChange={handleChange} className="crf-select" required>
                  {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#a0a0a0' }}>League *</label>
                <select name="league" value={formData.league} onChange={handleChange} className="crf-select" required>
                  {LEAGUES.map(l => <option key={l} value={l}>{l}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#a0a0a0' }}>Nationality *</label>
                <select name="nationality" value={formData.nationality} onChange={handleChange} className="crf-select" required>
                  {NATIONALITIES.map(n => <option key={n} value={n}>{n}</option>)}
                </select>
              </div>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#a0a0a0' }}>Club</label>
                <select name="club" value={formData.club} onChange={handleChange} className="crf-select">
                  <option value="">Free Agent</option>
                  {clubs.map(c => <option key={c.id} value={c.name}>{c.name}</option>)}
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#a0a0a0' }}>Value *</label>
                <input type="text" name="player_value" value={formData.player_value} onChange={handleChange} className="crf-input" placeholder="e.g. 5M, 500K, 10M" required />
              </div>
            </div>

            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#a0a0a0' }}>Game Status</label>
              <select name="game_banned" value={formData.game_banned} onChange={handleChange} className="crf-select">
                <option value="false">Active</option>
                <option value="true">Banned</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="submit" className="crf-btn crf-btn-primary" disabled={submitting}>
              <Save size={16} />{submitting ? 'Saving...' : (player ? 'Update' : 'Add')}
            </button>
            <button type="button" onClick={onClose} className="crf-btn crf-btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default PlayerSheet
