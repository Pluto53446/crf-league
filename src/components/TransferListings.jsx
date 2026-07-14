import React, { useState, useEffect, useCallback } from 'react'
import { supabase } from '../hooks/useSupabase'
import { useAuth } from '../hooks/useAuth'
import { 
  ShoppingCart, 
  Plus, 
  X, 
  Save, 
  Trash2,
  Tag,
  MessageSquare
} from 'lucide-react'

function TransferListings() {
  const [listings, setListings] = useState([])
  const [players, setPlayers] = useState([])
  const [loading, setLoading] = useState(true)
  const [showAddListing, setShowAddListing] = useState(false)
  const { isAdmin } = useAuth()

  const fetchData = useCallback(async () => {
    setLoading(true)
    const [{ data: listingsData }, { data: playersData }] = await Promise.all([
      supabase.from('transfer_listings').select('*, player:players(*)').order('created_at', { ascending: false }),
      supabase.from('players').select('*').order('roblox_username')
    ])
    setListings(listingsData || [])
    setPlayers(playersData || [])
    setLoading(false)
  }, [])

  useEffect(() => {
    fetchData()
    const subscription = supabase
      .channel('transfer_changes')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'transfer_listings' }, fetchData)
      .subscribe()
    return () => subscription.unsubscribe()
  }, [fetchData])

  const handleAddListing = async (formData) => {
    const player = players.find(p => p.id === formData.player_id)
    if (!player) return

    const { error } = await supabase.from('transfer_listings').insert([{
      player_id: formData.player_id,
      asking_price: parseFloat(formData.asking_price) || 0,
      current_club: player.club || 'Free Agent',
      position: player.position,
      description: formData.description || null,
    }])

    if (error) alert('Failed to create listing')
    setShowAddListing(false)
  }

  const handleDeleteListing = async (id) => {
    if (!confirm('Remove this player from the transfer list?')) return
    const { error } = await supabase.from('transfer_listings').delete().eq('id', id)
    if (error) alert('Failed to remove listing')
  }

  return (
    <div className="animate-fade-in">
      <div style={{
        display: 'flex',
        justifyContent: 'space-between',
        alignItems: 'center',
        marginBottom: '24px',
        flexWrap: 'wrap',
        gap: '16px',
      }}>
        <div>
          <h2 style={{ fontSize: '2rem', fontWeight: 700, marginBottom: '4px' }}>
            Transfer Listings
          </h2>
          <p style={{ color: '#a0a0a0', fontSize: '0.875rem' }}>
            {listings.length} players available for transfer
          </p>
        </div>

        {isAdmin && (
          <button
            onClick={() => setShowAddListing(true)}
            className="crf-btn crf-btn-primary"
          >
            <Plus size={18} />
            List Player
          </button>
        )}
      </div>

      {loading ? (
        <div style={{ display: 'grid', gap: '16px' }}>
          {[1, 2, 3].map(i => (
            <div key={i} className="crf-card">
              <div className="skeleton" style={{ height: '80px' }} />
            </div>
          ))}
        </div>
      ) : listings.length === 0 ? (
        <div className="crf-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
          <ShoppingCart size={48} style={{ margin: '0 auto 16px', opacity: 0.3, color: '#a0a0a0' }} />
          <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>No Transfer Listings</h3>
          <p style={{ color: '#a0a0a0' }}>Players listed for transfer will appear here.</p>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: '16px' }}>
          {listings.map(listing => (
            <div key={listing.id} className="crf-card" style={{ display: 'flex', gap: '20px', alignItems: 'center' }}>
              <img
                src={listing.player?.roblox_avatar_url || `https://placehold.co/80x80/1e1e3f/666?text=${listing.player?.roblox_username?.charAt(0)}`}
                alt={listing.player?.roblox_username}
                style={{
                  width: '80px',
                  height: '80px',
                  borderRadius: '12px',
                  objectFit: 'cover',
                  border: '2px solid #2a2a4a',
                  flexShrink: 0,
                }}
                onError={(e) => {
                  e.target.src = `https://placehold.co/80x80/1e1e3f/666?text=${listing.player?.roblox_username?.charAt(0)}`
                }}
              />

              <div style={{ flex: 1, minWidth: 0 }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '6px', flexWrap: 'wrap' }}>
                  <h3 style={{ fontSize: '1.2rem', fontWeight: 700 }}>
                    {listing.player?.roblox_username}
                  </h3>
                  <span style={{
                    background: 'rgba(233, 69, 96, 0.1)',
                    color: '#e94560',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 600,
                  }}>
                    {listing.current_club || 'Free Agent'}
                  </span>
                  <span style={{
                    background: 'rgba(15, 52, 96, 0.5)',
                    padding: '4px 10px',
                    borderRadius: '6px',
                    fontSize: '0.8rem',
                    fontWeight: 700,
                  }}>
                    {listing.position}
                  </span>
                </div>

                {listing.description && (
                  <p style={{ color: '#a0a0a0', fontSize: '0.875rem', marginBottom: '8px' }}>
                    <MessageSquare size={14} style={{ display: 'inline', marginRight: '6px', verticalAlign: 'middle' }} />
                    {listing.description}
                  </p>
                )}

                <div style={{ display: 'flex', gap: '16px', fontSize: '0.8rem', color: '#a0a0a0' }}>
                  <span>{listing.player?.goals || 0} Goals</span>
                  <span>{listing.player?.assists || 0} Assists</span>
                  <span>{listing.player?.yellow_cards || 0}YC {listing.player?.red_cards || 0}RC</span>
                </div>
              </div>

              <div style={{ textAlign: 'right', flexShrink: 0 }}>
                <div style={{
                  fontSize: '1.6rem',
                  fontWeight: 800,
                  fontFamily: 'Oswald, sans-serif',
                  color: '#22c55e',
                  lineHeight: 1,
                }}>
                  ${listing.asking_price?.toLocaleString() || '0'}
                </div>
                <div style={{ fontSize: '0.7rem', color: '#a0a0a0', textTransform: 'uppercase', letterSpacing: '0.1em' }}>
                  Asking Price
                </div>
                {isAdmin && (
                  <button
                    onClick={() => handleDeleteListing(listing.id)}
                    className="crf-btn crf-btn-sm crf-btn-danger"
                    style={{ marginTop: '12px' }}
                  >
                    <Trash2 size={14} />
                    Remove
                  </button>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Add Listing Modal */}
      {showAddListing && (
        <div className="modal-overlay" onClick={() => setShowAddListing(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <div style={{ padding: '24px', borderBottom: '1px solid #2a2a4a', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 700 }}>List Player for Transfer</h2>
              <button onClick={() => setShowAddListing(false)} style={{ background: 'none', border: 'none', color: '#a0a0a0', cursor: 'pointer' }}>
                <X size={24} />
              </button>
            </div>
            <form
              onSubmit={(e) => {
                e.preventDefault()
                const form = e.target
                handleAddListing({
                  player_id: form.player_id.value,
                  asking_price: form.asking_price.value,
                  description: form.description.value,
                })
              }}
              style={{ padding: '24px' }}
            >
              <div style={{ display: 'grid', gap: '16px' }}>
                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#a0a0a0' }}>
                    Select Player *
                  </label>
                  <select name="player_id" className="crf-select" required>
                    <option value="">Choose a player...</option>
                    {players.map(player => (
                      <option key={player.id} value={player.id}>
                        {player.roblox_username} ({player.position} · {player.club || 'Free Agent'})
                      </option>
                    ))}
                  </select>
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#a0a0a0' }}>
                    Asking Price ($)
                  </label>
                  <input
                    type="number"
                    name="asking_price"
                    className="crf-input"
                    placeholder="e.g. 5000000"
                    min="0"
                    required
                  />
                </div>

                <div>
                  <label style={{ display: 'block', marginBottom: '6px', fontSize: '0.875rem', fontWeight: 600, color: '#a0a0a0' }}>
                    Description (Optional)
                  </label>
                  <textarea
                    name="description"
                    className="crf-input"
                    placeholder="e.g. Young prospect with high potential..."
                    rows={3}
                    style={{ resize: 'vertical' }}
                  />
                </div>
              </div>

              <div style={{ display: 'flex', gap: '12px', marginTop: '24px' }}>
                <button type="submit" className="crf-btn crf-btn-primary">
                  <Tag size={16} />
                  List for Transfer
                </button>
                <button type="button" onClick={() => setShowAddListing(false)} className="crf-btn crf-btn-secondary">
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}

export default TransferListings
