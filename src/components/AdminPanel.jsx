import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../hooks/useSupabase'
import { useAuth } from '../hooks/useAuth'
import { 
  LayoutDashboard,
  Users,
  Shield,
  Trophy,
  ShoppingCart,
  AlertTriangle,
  CheckCircle,
  X,
  Plus,
  Save,
  Trash2,
  Edit2,
  Search
} from 'lucide-react'

const POSITIONS = ['GK', 'CB', 'LB', 'RB', 'CDM', 'CM', 'CAM', 'LW', 'RW', 'ST', 'CF']

function AdminPanel() {
  const { isAdmin } = useAuth()
  const [activeTab, setActiveTab] = useState('players')
  const [players, setPlayers] = useState([])
  const [clubs, setClubs] = useState([])
  const [transfers, setTransfers] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState('')
  const [editingPlayer, setEditingPlayer] = useState(null)
  const [showAddPlayer, setShowAddPlayer] = useState(false)
  const [showAddClub, setShowAddClub] = useState(false)
  const [showAddTransfer, setShowAddTransfer] = useState(false)
  const [message, setMessage] = useState(null)

  const showMessage = (text, type = 'success') => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 4000)
  }

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: p }, { data: c }, { data: t }] = await Promise.all([
      supabase.from('players').select('*').order('created_at', { ascending: false }),
      supabase.from('clubs').select('*').order('name'),
      supabase.from('transfer_listings').select('*, player:players(*)').order('created_at', { ascending: false })
    ])
    setPlayers(p || [])
    setClubs(c || [])
    setTransfers(t || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    if (!isAdmin) return
    fetchData()
    const sub = supabase
      .channel('admin_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'players' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'clubs' }, fetchData)
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transfer_listings' }, fetchData)
      .subscribe()
    return () => sub.unsubscribe()
  }, [fetchData, isAdmin])

  if (!isAdmin) {
    return (
      <div className="crf-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
        <AlertTriangle size={48} style={{ margin: '0 auto 16px', color: '#f59e0b' }} />
        <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Access Denied</h3>
        <p style={{ color: '#a0a0a0' }}>You must be an admin to access this panel.</p>
      </div>
    )
  }

  const getRobloxData = async (username) => {
    const cleanUsername = username.replace(/^@/, '').trim()

    if (!cleanUsername) {
      throw new Error('Please enter a Roblox username')
    }

    try {
      const { data, error } = await supabase.functions.invoke('fetch-roblox-user', {
        body: { username: cleanUsername }
      })

      if (error) {
        throw new Error(`Edge function error: ${error.message}`)
      }

      if (data.error) {
        throw new Error(data.error)
      }

      return {
        userId: data.userId,
        username: data.username,
        avatarUrl: data.avatarUrl
      }
    } catch (err) {
      if (err.message.includes('not found')) {
        throw err
      }
      throw new Error(`Failed to fetch Roblox data: ${err.message}. Please try again.`)
    }
  }

  const handleAddPlayer = async (formData) => {
    try {
      const robloxData = await getRobloxData(formData.roblox_username)
      const { error } = await supabase.from('players').insert([{
        roblox_username: robloxData.username,
        roblox_user_id: String(robloxData.userId),
        roblox_avatar_url: robloxData.avatarUrl,
        club: formData.club || null,
        position: formData.position,
        goals: parseInt(formData.goals) || 0,
        assists: parseInt(formData.assists) || 0,
        tackles: formData.position === 'GK' ? 0 : (parseInt(formData.tackles) || 0),
        saves: formData.position === 'GK' ? (parseInt(formData.saves) || 0) : 0,
        yellow_cards: parseInt(formData.yellow_cards) || 0,
        red_cards: parseInt(formData.red_cards) || 0,
      }])
      if (error) throw error
      showMessage('Player added successfully!')
      setShowAddPlayer(false)
    } catch (err) {
      showMessage(err.message, 'error')
    }
  }

  const handleEditPlayer = async (formData) => {
    try {
      const updateData = {
        club: formData.club || null,
        position: formData.position,
        goals: parseInt(formData.goals) || 0,
        assists: parseInt(formData.assists) || 0,
        tackles: formData.position === 'GK' ? 0 : (parseInt(formData.tackles) || 0),
        saves: formData.position === 'GK' ? (parseInt(formData.saves) || 0) : 0,
        yellow_cards: parseInt(formData.yellow_cards) || 0,
        red_cards: parseInt(formData.red_cards) || 0,
      }
      if (formData.roblox_username !== editingPlayer.roblox_username) {
        const robloxData = await getRobloxData(formData.roblox_username)
        updateData.roblox_username = robloxData.username
        updateData.roblox_user_id = String(robloxData.userId)
        updateData.roblox_avatar_url = robloxData.avatarUrl
      }
      const { error } = await supabase.from('players').update(updateData).eq('id', editingPlayer.id)
      if (error) throw error
      showMessage('Player updated successfully!')
      setEditingPlayer(null)
    } catch (err) {
      showMessage(err.message, 'error')
    }
  }

  const handleDeletePlayer = async (id) => {
    if (!confirm('Delete this player?')) return
    const { error } = await supabase.from('players').delete().eq('id', id)
    if (error) showMessage('Failed to delete player', 'error')
    else showMessage('Player deleted!')
  }

  const handleAddClub = async (name) => {
    const { error } = await supabase.from('clubs').insert([{ name }])
    if (error) showMessage('Failed to create club', 'error')
    else { showMessage('Club created!'); setShowAddClub(false) }
  }

  const handleDeleteClub = async (id) => {
    if (!confirm('Delete this club?')) return
    const { error } = await supabase.from('clubs').delete().eq('id', id)
    if (error) showMessage('Failed to delete club', 'error')
    else showMessage('Club deleted!')
  }

  const handleAddTransfer = async (formData) => {
    const player = players.find(p => p.id === formData.player_id)
    if (!player) return
    const { error } = await supabase.from('transfer_listings').insert([{
      player_id: formData.player_id,
      asking_price: parseFloat(formData.asking_price) || 0,
      current_club: player.club || 'Free Agent',
      position: player.position,
      description: formData.description || null,
    }])
    if (error) showMessage('Failed to create listing', 'error')
    else { showMessage('Transfer listing created!'); setShowAddTransfer(false) }
  }

  const handleDeleteTransfer = async (id) => {
    if (!confirm('Remove this transfer listing?')) return
    const { error } = await supabase.from('transfer_listings').delete().eq('id', id)
    if (error) showMessage('Failed to remove listing', 'error')
    else showMessage('Listing removed!')
  }

  const tabs = [
    { key: 'players', label: 'Players', icon: Users, count: players.length },
    { key: 'clubs', label: 'Clubs', icon: Shield, count: clubs.length },
    { key: 'transfers', label: 'Transfers', icon: ShoppingCart, count: transfers.length },
  ]

  const filteredPlayers = players.filter(p => 
    p.roblox_username.toLowerCase().includes(searchQuery.toLowerCase()) ||
    p.club?.toLowerCase().includes(searchQuery.toLowerCase())
  )

  return (
    <div className="animate-fade-in">
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
          {message.type === 'error' ? <AlertTriangle size={18} /> : <CheckCircle size={18} />}
          {message.text}
        </div>
      )}

      <div style={{ marginBottom: '24px' }}>
        <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '4px' }}>
          Admin Panel
        </h2>
        <p style={{ color: '#a0a0a0', fontSize: '0.875rem' }}>
          Manage players, clubs, and transfer listings
        </p>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '16px', marginBottom: '24px' }}>
        {[
          { label: 'Total Players', value: players.length, icon: Users, color: '#3b82f6' },
          { label: 'Total Clubs', value: clubs.length, icon: Shield, color: '#8b5cf6' },
          { label: 'Transfer Listings', value: transfers.length, icon: ShoppingCart, color: '#22c55e' },
          { label: 'Free Agents', value: players.filter(p => !p.club).length, icon: Trophy, color: '#f59e0b' },
        ].map((stat, i) => (
          <div key={i} className="crf-card" style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
            <div style={{
              width: '48px',
              height: '48px',
              borderRadius: '12px',
              background: `${stat.color}20`,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}>
              <stat.icon size={24} color={stat.color} />
            </div>
            <div>
              <div style={{ fontSize: '1.8rem', fontWeight: 800, fontFamily: 'Oswald, sans-serif', lineHeight: 1 }}>
                {stat.value}
              </div>
              <div style={{ fontSize: '0.8rem', color: '#a0a0a0' }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid #2a2a4a' }}>
        {tabs.map(tab => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '8px',
                padding: '12px 20px',
                border: 'none',
                background: 'none',
                cursor: 'pointer',
                fontWeight: 600,
                fontSize: '0.875rem',
                color: isActive ? '#e94560' : '#a0a0a0',
                borderBottom: `2px solid ${isActive ? '#e94560' : 'transparent'}`,
                marginBottom: '-1px',
                transition: 'all 0.2s',
              }}
            >
              <Icon size={16} />
              {tab.label}
              <span style={{
                background: isActive ? 'rgba(233, 69, 96, 0.2)' : 'rgba(255,255,255,0.05)',
                color: isActive ? '#e94560' : '#a0a0a0',
                padding: '2px 8px',
                borderRadius: '10px',
                fontSize: '0.7rem',
              }}>
                {tab.count}
              </span>
            </button>
          )
        })}
      </div>

      {activeTab === 'players' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '12px' }}>
            <div style={{ position: 'relative', flex: 1, minWidth: '250px', maxWidth: '400px' }}>
              <Search size={18} style={{ position: 'absolute', left: '14px', top: '50%', transform: 'translateY(-50%)', color: '#a0a0a0' }} />
              <input
                type="text"
                placeholder="Search players..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="crf-input"
                style={{ paddingLeft: '44px' }}
              />
            </div>
            <button onClick={() => setShowAddPlayer(true)} className="crf-btn crf-btn-primary">
              <Plus size={16} /> Add Player
            </button>
          </div>

          <div style={{ background: '#1e1e3f', border: '1px solid #2a2a4a', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="crf-table">
                <thead>
                  <tr>
                    <th>Player</th><th>Club</th><th>Pos</th><th>G</th><th>A</th><th>T</th><th>S</th><th>YC</th><th>RC</th><th>Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan="10" style={{ textAlign: 'center', padding: '40px' }}><div className="skeleton" style={{ height: '20px', width: '200px', margin: '0 auto' }} /></td></tr>
                  ) : filteredPlayers.length === 0 ? (
                    <tr><td colSpan="10" style={{ textAlign: 'center', padding: '40px', color: '#a0a0a0' }}>No players found</td></tr>
                  ) : (
                    filteredPlayers.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src={p.roblox_avatar_url || `https://placehold.co/32x32/1e1e3f/666?text=${p.roblox_username?.charAt(0)}`} alt="" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} onError={e => e.target.src = `https://placehold.co/32x32/1e1e3f/666?text=${p.roblox_username?.charAt(0)}`} />
                            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.roblox_username}</span>
                          </div>
                        </td>
                        <td><span style={{ background: 'rgba(233,69,96,0.1)', color: '#e94560', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 600 }}>{p.club || 'Free'}</span></td>
                        <td><span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{p.position}</span></td>
                        <td style={{ fontWeight: 600 }}>{p.goals}</td>
                        <td style={{ fontWeight: 600 }}>{p.assists}</td>
                        <td style={{ fontWeight: 600 }}>{p.tackles || '-'}</td>
                        <td style={{ fontWeight: 600 }}>{p.saves || '-'}</td>
                        <td>{p.yellow_cards > 0 ? <span className="badge badge-yellow">{p.yellow_cards}</span> : '-'}</td>
                        <td>{p.red_cards > 0 ? <span className="badge badge-red">{p.red_cards}</span> : '-'}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button onClick={() => setEditingPlayer(p)} className="crf-btn crf-btn-sm crf-btn-secondary" style={{ padding: '4px' }}><Edit2 size={12} /></button>
                            <button onClick={() => handleDeletePlayer(p.id)} className="crf-btn crf-btn-sm crf-btn-danger" style={{ padding: '4px' }}><Trash2 size={12} /></button>
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {activeTab === 'clubs' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={() => setShowAddClub(true)} className="crf-btn crf-btn-primary">
              <Plus size={16} /> Create Club
            </button>
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '16px' }}>
            {clubs.map(club => {
              const clubPlayers = players.filter(p => p.club === club.name)
              return (
                <div key={club.id} className="crf-card">
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                      <div style={{ width: '40px', height: '40px', borderRadius: '10px', background: 'linear-gradient(135deg, #e94560, #c73e54)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                        <Shield size={20} color="white" />
                      </div>
                      <div>
                        <h4 style={{ fontWeight: 700 }}>{club.name}</h4>
                        <p style={{ fontSize: '0.8rem', color: '#a0a0a0' }}>{clubPlayers.length}/21 players</p>
                      </div>
                    </div>
                    <button onClick={() => handleDeleteClub(club.id)} className="crf-btn crf-btn-sm crf-btn-danger" style={{ padding: '4px' }}><Trash2 size={14} /></button>
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px' }}>
                    {clubPlayers.slice(0, 6).map(p => (
                      <img key={p.id} src={p.roblox_avatar_url || `https://placehold.co/28x28/1e1e3f/666?text=${p.roblox_username?.charAt(0)}`} alt="" style={{ width: '28px', height: '28px', borderRadius: '4px', objectFit: 'cover' }} title={p.roblox_username} onError={e => e.target.style.display='none'} />
                    ))}
                    {clubPlayers.length > 6 && (
                      <div style={{ width: '28px', height: '28px', borderRadius: '4px', background: 'rgba(255,255,255,0.05)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '0.7rem', fontWeight: 700 }}>+{clubPlayers.length - 6}</div>
                    )}
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}

      {activeTab === 'transfers' && (
        <div>
          <div style={{ display: 'flex', justifyContent: 'flex-end', marginBottom: '16px' }}>
            <button onClick={() => setShowAddTransfer(true)} className="crf-btn crf-btn-primary">
              <Plus size={16} /> List Player
            </button>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {transfers.map(listing => (
              <div key={listing.id} className="crf-card" style={{ display: 'flex', gap: '16px', alignItems: 'center' }}>
                <img src={listing.player?.roblox_avatar_url || `https://placehold.co/56x56/1e1e3f/666?text=${listing.player?.roblox_username?.charAt(0)}`} alt="" style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} onError={e => e.target.src = `https://placehold.co/56x56/1e1e3f/666?text=${listing.player?.roblox_username?.charAt(0)}`} />
                <div style={{ flex: 1, minWidth: 0 }}>
                  <div style={{ fontWeight: 700, marginBottom: '2px' }}>{listing.player?.roblox_username}</div>
                  <div style={{ fontSize: '0.8rem', color: '#a0a0a0', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                    <span>{listing.current_club || 'Free Agent'}</span>
                    <span>{listing.position}</span>
                    {listing.description && <span style={{ color: '#666' }}>· {listing.description}</span>}
                  </div>
                </div>
                <div style={{ textAlign: 'right', flexShrink: 0 }}>
                  <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Oswald, sans-serif', color: '#22c55e' }}>${listing.asking_price?.toLocaleString()}</div>
                  <button onClick={() => handleDeleteTransfer(listing.id)} className="crf-btn crf-btn-sm crf-btn-danger" style={{ marginTop: '6px' }}>
                    <Trash2 size={12} /> Remove
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {(showAddPlayer || editingPlayer) && (
        <PlayerModal
          player={editingPlayer}
          clubs={clubs}
          onClose={() => { setShowAddPlayer(false); setEditingPlayer(null) }}
          onSubmit={editingPlayer ? handleEditPlayer : handleAddPlayer}
        />
      )}

      {showAddClub && (
        <div className="modal-overlay" onClick={() => setShowAddClub(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '24px', borderBottom: '1px solid #2a2a4a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>Create New Club</h2>
              <button onClick={() => setShowAddClub(false)} style={{ background: 'none', border: 'none', color: '#a0a0a0', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleAddClub(e.target.clubName.value.trim()) }} style={{ padding: '24px' }}>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#a0a0a0' }}>Club Name</label>
              <input type="text" name="clubName" className="crf-input" placeholder="e.g. Manchester United" required autoFocus />
              <div style={{ display: 'flex', gap: '12px', marginTop: '20px' }}>
                <button type="submit" className="crf-btn crf-btn-primary"><Save size={16} /> Create</button>
                <button type="button" onClick={() => setShowAddClub(false)} className="crf-btn crf-btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {showAddTransfer && (
        <div className="modal-overlay" onClick={() => setShowAddTransfer(false)}>
          <div className="modal-content" onClick={e => e.stopPropagation()}>
            <div style={{ padding: '24px', borderBottom: '1px solid #2a2a4a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>List Player for Transfer</h2>
              <button onClick={() => setShowAddTransfer(false)} style={{ background: 'none', border: 'none', color: '#a0a0a0', cursor: 'pointer' }}><X size={24} /></button>
            </div>
            <form onSubmit={e => { e.preventDefault(); handleAddTransfer({ player_id: e.target.player_id.value, asking_price: e.target.asking_price.value, description: e.target.description.value }) }} style={{ padding: '24px' }}>
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#a0a0a0' }}>Select Player *</label>
                  <select name="player_id" className="crf-select" required>
                    <option value="">Choose a player...</option>
                    {players.map(p => (
                      <option key={p.id} value={p.id}>{p.roblox_username} ({p.position} · {p.club || 'Free Agent'})</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#a0a0a0' }}>Asking Price ($)</label>
                  <input type="number" name="asking_price" className="crf-input" placeholder="e.g. 5000000" min="0" required />
                </div>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#a0a0a0' }}>Description (Optional)</label>
                  <textarea name="description" className="crf-input" placeholder="e.g. Young prospect..." rows={3} style={{ resize: 'vertical' }} />
                </div>
              </div>
              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="crf-btn crf-btn-primary"><Save size={16} /> List</button>
                <button type="button" onClick={() => setShowAddTransfer(false)} className="crf-btn crf-btn-secondary">Cancel</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

function PlayerModal({ player, clubs, onClose, onSubmit }) {
  const [formData, setFormData] = useState({
    roblox_username: player?.roblox_username || '',
    club: player?.club || '',
    position: player?.position || 'ST',
    goals: player?.goals || 0,
    assists: player?.assists || 0,
    tackles: player?.tackles || 0,
    saves: player?.saves || 0,
    yellow_cards: player?.yellow_cards || 0,
    red_cards: player?.red_cards || 0,
  })
  const [submitting, setSubmitting] = useState(false)
  const isGoalkeeper = formData.position === 'GK'

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
      <div className="modal-content" onClick={e => e.stopPropagation()}>
        <div style={{ padding: '24px', borderBottom: '1px solid #2a2a4a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>{player ? 'Edit Player' : 'Add New Player'}</h2>
          <button onClick={onClose} style={{ background: 'none', border: 'none', color: '#a0a0a0', cursor: 'pointer' }}><X size={24} /></button>
        </div>
        <form onSubmit={handleSubmit} style={{ padding: '24px' }}>
          <div style={{ display: 'grid', gap: '16px' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#a0a0a0' }}>Roblox Username *</label>
              <input type="text" name="roblox_username" value={formData.roblox_username} onChange={handleChange} className="crf-input" placeholder="Enter Roblox username (no @ needed)" required disabled={!!player} />
              {!player && <p style={{ fontSize: '0.75rem', color: '#a0a0a0', marginTop: '4px' }}>Avatar and User ID will be fetched automatically.</p>}
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
                <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#a0a0a0' }}>Position *</label>
                <select name="position" value={formData.position} onChange={handleChange} className="crf-select" required>
                  {POSITIONS.map(pos => <option key={pos} value={pos}>{pos}</option>)}
                </select>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#a0a0a0' }}>Goals</label><input type="number" name="goals" value={formData.goals} onChange={handleChange} className="crf-input" min="0" /></div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#a0a0a0' }}>Assists</label><input type="number" name="assists" value={formData.assists} onChange={handleChange} className="crf-input" min="0" /></div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#a0a0a0' }}>{isGoalkeeper ? 'Saves' : 'Tackles'}</label><input type="number" name={isGoalkeeper ? 'saves' : 'tackles'} value={isGoalkeeper ? formData.saves : formData.tackles} onChange={handleChange} className="crf-input" min="0" /></div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
              <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#a0a0a0' }}>Yellow Cards</label><input type="number" name="yellow_cards" value={formData.yellow_cards} onChange={handleChange} className="crf-input" min="0" /></div>
              <div><label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#a0a0a0' }}>Red Cards</label><input type="number" name="red_cards" value={formData.red_cards} onChange={handleChange} className="crf-input" min="0" /></div>
            </div>
          </div>
          <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
            <button type="submit" className="crf-btn crf-btn-primary" disabled={submitting}><Save size={16} />{submitting ? 'Saving...' : (player ? 'Update' : 'Add')}</button>
            <button type="button" onClick={onClose} className="crf-btn crf-btn-secondary">Cancel</button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default AdminPanel
