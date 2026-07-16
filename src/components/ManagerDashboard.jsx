import React, { useState, useEffect } from 'react'
import { supabase } from '../hooks/useSupabase'
import BudgetDisplay from './BudgetDisplay'
import { 
  Shield, Users, DollarSign, LogOut, Loader2, 
  ArrowUpRight, ArrowDownRight, Send, Trash2, Tag,
  CheckCircle, XCircle, Gavel, Wallet, UserCheck
} from 'lucide-react'

const ManagerDashboard = () => {
  const [manager, setManager] = useState(null)
  const [players, setPlayers] = useState([])
  const [budget, setBudget] = useState(null)
  const [loading, setLoading] = useState(true)
  const [activeSection, setActiveSection] = useState('squad')
  const [transferListings, setTransferListings] = useState([])
  const [bids, setBids] = useState([])
  const [incomingBids, setIncomingBids] = useState([])
  const [message, setMessage] = useState(null)

  useEffect(() => {
    const stored = localStorage.getItem('crf_manager')
    if (stored) {
      try {
        const parsed = JSON.parse(stored)
        setManager(parsed)
        fetchManagerData(parsed.club)
      } catch {
        localStorage.removeItem('crf_manager')
        setLoading(false)
      }
    } else {
      setLoading(false)
    }
  }, [])

  const fetchManagerData = async (clubName) => {
    setLoading(true)
    try {
      const [{ data: clubPlayers }, { data: clubBudget }, { data: listings }, { data: managerBids }, { data: allBids }] = await Promise.all([
        supabase.from('players').select('*').eq('club', clubName),
        supabase.from('club_budgets').select('*').eq('club_name', clubName).single(),
        supabase.from('transfer_listings').select('*, player:players(*)').order('created_at', { ascending: false }),
        supabase.from('bids').select('*').eq('club', clubName).order('created_at', { ascending: false }),
        supabase.from('bids').select('*').order('created_at', { ascending: false }),
      ])

      setPlayers(clubPlayers || [])
      setBudget(clubBudget || { budget: 100000000, spent: 0, earned: 0 })
      setTransferListings(listings || [])
      setBids(managerBids || [])

      // Get incoming bids on listings from this manager's club
      const myListings = (listings || []).filter(l => l.current_club === clubName)
      const myListingIds = myListings.map(l => l.id)
      const incoming = (allBids || []).filter(b => myListingIds.includes(b.transfer_listing_id) && b.status === 'pending')
      setIncomingBids(incoming)
    } catch (err) {
      console.error('Error fetching manager data:', err)
    } finally {
      setLoading(false)
    }
  }

  const handleLogout = () => {
    localStorage.removeItem('crf_manager')
    window.location.reload()
  }

  const handleReleasePlayer = async (player) => {
    if (!window.confirm(`Release ${player.roblox_username}? You will NOT receive any compensation.`)) return

    try {
      const { error: playerError } = await supabase
        .from('players')
        .update({ club: null })
        .eq('id', player.id)

      if (playerError) throw playerError

      await supabase.from('manager_logs').insert([{
        manager_id: manager?.id,
        manager_username: manager?.username,
        club: manager?.club,
        action: 'player_released',
        player_name: player.roblox_username,
        amount: 0,
        details: { type: 'manager_release', compensation: 0 },
      }])

      showMessage(`${player.roblox_username} released`, 'success')
      fetchManagerData(manager.club)
    } catch (err) {
      showMessage('Failed to release player: ' + err.message, 'error')
    }
  }

  const handleListPlayer = async (player, price) => {
    try {
      const { error } = await supabase.from('transfer_listings').insert([{
        player_id: player.id,
        asking_price: parseFloat(price) || 0,
        current_club: manager?.club,
        position: player.position,
      }])

      if (error) throw error

      await supabase.from('manager_logs').insert([{
        manager_id: manager?.id,
        manager_username: manager?.username,
        club: manager?.club,
        action: 'player_listed',
        player_name: player.roblox_username,
        amount: parseFloat(price) || 0,
        details: { type: 'manager_listed' },
      }])

      showMessage(`${player.roblox_username} listed for transfer`, 'success')
      fetchManagerData(manager.club)
    } catch (err) {
      showMessage('Failed to list player: ' + err.message, 'error')
    }
  }

  const handleAcceptBid = async (bid) => {
    try {
      // Find the listing
      const listing = transferListings.find(l => l.id === bid.transfer_listing_id)
      if (!listing) throw new Error('Listing not found')

      // Get buyer budget
      const { data: buyerBudget } = await supabase
        .from('club_budgets')
        .select('*')
        .eq('club_name', bid.club)
        .single()

      if (!buyerBudget) throw new Error('Buyer club budget not found')

      const buyerRemaining = buyerBudget.budget - buyerBudget.spent + buyerBudget.earned
      if (bid.bid_amount > buyerRemaining) {
        showMessage('Buyer no longer has sufficient budget', 'error')
        return
      }

      // Get seller budget (this manager's club)
      const { data: sellerBudget } = await supabase
        .from('club_budgets')
        .select('*')
        .eq('club_name', manager.club)
        .single()

      // Update buyer budget (deduct)
      await supabase
        .from('club_budgets')
        .update({ spent: buyerBudget.spent + bid.bid_amount })
        .eq('id', buyerBudget.id)

      // Update seller budget (add to earned)
      if (sellerBudget) {
        await supabase
          .from('club_budgets')
          .update({ earned: sellerBudget.earned + bid.bid_amount })
          .eq('id', sellerBudget.id)
      }

      // Move player to buyer club
      await supabase
        .from('players')
        .update({ club: bid.club })
        .eq('id', listing.player_id)

      // Update bid status
      await supabase
        .from('bids')
        .update({ status: 'accepted' })
        .eq('id', bid.id)

      // Reject other bids on this listing
      await supabase
        .from('bids')
        .update({ status: 'rejected' })
        .eq('transfer_listing_id', bid.transfer_listing_id)
        .neq('id', bid.id)

      // Remove listing
      await supabase.from('transfer_listings').delete().eq('id', bid.transfer_listing_id)

      // Log for buyer
      await supabase.from('manager_logs').insert([{
        manager_id: bid.manager_id,
        manager_username: bid.manager_username,
        club: bid.club,
        action: 'player_signed',
        player_name: listing.player?.roblox_username,
        amount: bid.bid_amount,
        details: { type: 'transfer_purchase', from_club: manager.club },
      }])

      // Log for seller (this manager)
      await supabase.from('manager_logs').insert([{
        manager_id: manager.id,
        manager_username: manager.username,
        club: manager.club,
        action: 'player_transferred',
        player_name: listing.player?.roblox_username,
        amount: bid.bid_amount,
        details: { type: 'transfer_sale', to_club: bid.club },
      }])

      showMessage(`Bid accepted! ${listing.player?.roblox_username} transferred to ${bid.club} for $${bid.bid_amount.toLocaleString()}`, 'success')
      fetchManagerData(manager.club)
    } catch (err) {
      showMessage('Failed to accept bid: ' + err.message, 'error')
    }
  }

  const handleRejectBid = async (bid) => {
    try {
      const { error } = await supabase
        .from('bids')
        .update({ status: 'rejected' })
        .eq('id', bid.id)
      if (error) throw error
      showMessage('Bid rejected', 'success')
      fetchManagerData(manager.club)
    } catch (err) {
      showMessage('Failed to reject bid: ' + err.message, 'error')
    }
  }

  const showMessage = (text, type) => {
    setMessage({ text, type })
    setTimeout(() => setMessage(null), 4000)
  }

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '400px', flexDirection: 'column', gap: '16px' }}>
        <Loader2 size={40} style={{ color: 'var(--crf-gold)', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--crf-text-muted)' }}>Loading manager dashboard...</p>
      </div>
    )
  }

  if (!manager) {
    return (
      <div className="crf-card" style={{ textAlign: 'center', padding: '60px 24px' }}>
        <Shield size={48} style={{ margin: '0 auto 16px', color: 'var(--crf-text-muted)' }} />
        <h3 style={{ fontSize: '1.2rem', marginBottom: '8px' }}>Manager Access Required</h3>
        <p style={{ color: 'var(--crf-text-muted)', marginBottom: '20px' }}>
          You must be logged in as an approved manager to access this dashboard.
        </p>
      </div>
    )
  }

  const remainingBudget = budget ? budget.budget - budget.spent + budget.earned : 0
  const myListings = transferListings.filter(l => l.current_club === manager.club)

  return (
    <div className="animate-fade-in">
      {message && (
        <div style={{
          position: 'fixed', top: '80px', right: '24px', zIndex: 1000,
          padding: '16px 20px', borderRadius: '8px',
          display: 'flex', alignItems: 'center', gap: '10px',
          fontWeight: 600, fontSize: '0.875rem',
          animation: 'slideIn 0.3s ease-out',
          background: message.type === 'error' ? 'rgba(239, 68, 68, 0.15)' : 'rgba(34, 197, 94, 0.15)',
          border: `1px solid ${message.type === 'error' ? 'rgba(239, 68, 68, 0.3)' : 'rgba(34, 197, 94, 0.3)'}`,
          color: message.type === 'error' ? '#ef4444' : '#22c55e',
        }}>
          {message.text}
        </div>
      )}

      {/* Header */}
      <div style={{ marginBottom: '24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <h1 style={{ fontFamily: 'Oswald, sans-serif', fontSize: '1.8rem', fontWeight: 700, margin: '0 0 4px 0' }}>
            {manager.club}
          </h1>
          <p style={{ color: 'var(--crf-text-muted)', fontSize: '0.85rem', margin: 0 }}>
            Manager: {manager.username}
          </p>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <BudgetDisplay budget={budget?.budget || 100000000} spent={budget?.spent || 0} earned={budget?.earned || 0} compact />
          <button onClick={handleLogout} className="crf-btn crf-btn-danger" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>
            <LogOut size={14} /> Logout
          </button>
        </div>
      </div>

      {/* Navigation */}
      <div style={{ display: 'flex', gap: '4px', marginBottom: '24px', borderBottom: '1px solid var(--crf-border)', overflowX: 'auto' }}>
        {[
          { key: 'squad', label: 'My Squad', icon: Users },
          { key: 'transfers', label: 'Transfer Market', icon: ArrowUpRight },
          { key: 'bids', label: 'My Bids', icon: Send },
          ...(incomingBids.length > 0 ? [{ key: 'incoming', label: `Incoming Bids (${incomingBids.length})`, icon: Gavel }] : []),
        ].map(tab => {
          const Icon = tab.icon
          const isActive = activeSection === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveSection(tab.key)}
              style={{
                display: 'flex', alignItems: 'center', gap: '8px',
                padding: '12px 20px', border: 'none', background: 'none',
                cursor: 'pointer', fontWeight: 600, fontSize: '0.875rem',
                color: isActive ? '#e94560' : 'var(--crf-text-muted)',
                borderBottom: `2px solid ${isActive ? '#e94560' : 'transparent'}`,
                marginBottom: '-1px', transition: 'all 0.2s', whiteSpace: 'nowrap',
              }}
            >
              <Icon size={16} />
              {tab.label}
            </button>
          )
        })}
      </div>

      {/* Squad Section */}
      {activeSection === 'squad' && (
        <div>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '16px', marginBottom: '24px' }}>
            <BudgetDisplay budget={budget?.budget || 100000000} spent={budget?.spent || 0} earned={budget?.earned || 0} />

            <div className="crf-card" style={{ padding: '20px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '16px' }}>
                <div style={{
                  width: '40px', height: '40px', borderRadius: '10px',
                  background: 'linear-gradient(135deg, #3b82f6, #1d4ed8)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                }}>
                  <Users size={20} color="white" />
                </div>
                <div>
                  <h3 style={{ fontSize: '1.1rem', fontWeight: 700, margin: 0, fontFamily: 'Oswald, sans-serif' }}>Squad Size</h3>
                  <p style={{ fontSize: '0.75rem', color: 'var(--crf-text-muted)', margin: '2px 0 0 0' }}>{players.length}/21 players</p>
                </div>
              </div>
              <div style={{ fontSize: '2.2rem', fontWeight: 800, fontFamily: 'Oswald, sans-serif', color: '#3b82f6' }}>
                {players.length}
              </div>
            </div>
          </div>

          <div style={{ background: 'var(--crf-card)', border: '1px solid var(--crf-border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="crf-table">
                <thead>
                  <tr><th>Player</th><th>Pos</th><th>G</th><th>A</th><th>Actions</th></tr>
                </thead>
                <tbody>
                  {players.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--crf-text-muted)' }}>No players in squad</td></tr>
                  ) : (
                    players.map(p => (
                      <tr key={p.id}>
                        <td>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                            <img src={p.roblox_avatar_url || `https://placehold.co/32x32/1e1e3f/666?text=${p.roblox_username?.charAt(0)}`} alt="" style={{ width: '32px', height: '32px', borderRadius: '6px', objectFit: 'cover' }} />
                            <span style={{ fontWeight: 600, fontSize: '0.85rem' }}>{p.roblox_username}</span>
                          </div>
                        </td>
                        <td><span style={{ fontWeight: 700, fontSize: '0.8rem' }}>{p.position}</span></td>
                        <td style={{ fontWeight: 600 }}>{p.goals}</td>
                        <td style={{ fontWeight: 600 }}>{p.assists}</td>
                        <td>
                          <div style={{ display: 'flex', gap: '4px' }}>
                            <button 
                              onClick={() => {
                                const price = prompt(`List ${p.roblox_username} for how much?`, '5000000')
                                if (price) handleListPlayer(p, price)
                              }}
                              className="crf-btn crf-btn-sm"
                              style={{ padding: '4px 8px', fontSize: '0.7rem', background: 'rgba(245, 158, 11, 0.2)', color: '#f59e0b' }}
                            >
                              <Tag size={12} /> List
                            </button>
                            <button 
                              onClick={() => handleReleasePlayer(p)}
                              className="crf-btn crf-btn-sm crf-btn-danger"
                              style={{ padding: '4px 8px', fontSize: '0.7rem' }}
                            >
                              <Trash2 size={12} /> Release
                            </button>
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

      {/* Transfer Market Section */}
      {activeSection === 'transfers' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <p style={{ color: 'var(--crf-text-muted)', fontSize: '0.85rem' }}>
              Browse available players and place bids. Budget remaining: <span style={{ fontWeight: 700, color: '#22c55e' }}>${remainingBudget.toLocaleString()}</span>
            </p>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {transferListings.filter(l => l.current_club !== manager.club).length === 0 ? (
              <div className="crf-card" style={{ textAlign: 'center', padding: '60px', color: 'var(--crf-text-muted)' }}>
                <ArrowUpRight size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p>No players available on the transfer market.</p>
              </div>
            ) : (
              transferListings.filter(l => l.current_club !== manager.club).map(listing => (
                <div key={listing.id} className="crf-card" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                  <img src={listing.player?.roblox_avatar_url || `https://placehold.co/56x56/1e1e3f/666?text=${listing.player?.roblox_username?.charAt(0)}`} alt="" style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                  <div style={{ flex: 1, minWidth: '200px' }}>
                    <div style={{ fontWeight: 700, marginBottom: '2px' }}>{listing.player?.roblox_username}</div>
                    <div style={{ fontSize: '0.8rem', color: 'var(--crf-text-muted)', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                      <span>{listing.current_club || 'Free Agent'}</span>
                      <span>{listing.position}</span>
                      {listing.description && <span style={{ color: '#666' }}>· {listing.description}</span>}
                    </div>
                  </div>
                  <div style={{ textAlign: 'right', flexShrink: 0 }}>
                    <div style={{ fontSize: '1.4rem', fontWeight: 800, fontFamily: 'Oswald, sans-serif', color: '#22c55e' }}>
                      ${listing.asking_price?.toLocaleString()}
                    </div>
                    <button
                      onClick={() => {
                        const bid = prompt(`Place bid for ${listing.player?.roblox_username}? Current asking: $${listing.asking_price?.toLocaleString()}`, listing.asking_price)
                        if (bid) {
                          const amount = parseFloat(bid)
                          if (amount > remainingBudget) {
                            showMessage('Insufficient budget for this bid', 'error')
                            return
                          }
                          // Place bid directly
                          supabase.from('bids').insert([{
                            transfer_listing_id: listing.id,
                            manager_id: manager.id,
                            manager_username: manager.username,
                            club: manager.club,
                            bid_amount: amount,
                            status: 'pending',
                          }]).then(async ({ error }) => {
                            if (error) {
                              showMessage('Failed to place bid: ' + error.message, 'error')
                              return
                            }
                            await supabase.from('manager_logs').insert([{
                              manager_id: manager.id,
                              manager_username: manager.username,
                              club: manager.club,
                              action: 'bid_placed',
                              player_name: listing.player?.roblox_username,
                              amount: amount,
                              details: { type: 'bid_placed', listing_id: listing.id },
                            }])
                            showMessage(`Bid of $${amount.toLocaleString()} placed`, 'success')
                            fetchManagerData(manager.club)
                          })
                        }
                      }}
                      className="crf-btn crf-btn-primary"
                      style={{ marginTop: '6px', padding: '6px 14px', fontSize: '0.8rem' }}
                    >
                      <Send size={12} /> Place Bid
                    </button>
                  </div>
                </div>
              ))
            )}
          </div>
        </div>
      )}

      {/* My Bids Section */}
      {activeSection === 'bids' && (
        <div>
          <div style={{ background: 'var(--crf-card)', border: '1px solid var(--crf-border)', borderRadius: '12px', overflow: 'hidden' }}>
            <div style={{ overflowX: 'auto' }}>
              <table className="crf-table">
                <thead>
                  <tr><th>Player</th><th>From Club</th><th>Bid Amount</th><th>Status</th><th>Date</th></tr>
                </thead>
                <tbody>
                  {bids.length === 0 ? (
                    <tr><td colSpan="5" style={{ textAlign: 'center', padding: '40px', color: 'var(--crf-text-muted)' }}>No bids placed yet</td></tr>
                  ) : (
                    bids.map(bid => {
                      const listing = transferListings.find(l => l.id === bid.transfer_listing_id)
                      return (
                        <tr key={bid.id}>
                          <td style={{ fontWeight: 600 }}>{bid.player_name || listing?.player?.roblox_username || 'Unknown'}</td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--crf-text-muted)' }}>{listing?.current_club || 'Unknown'}</td>
                          <td style={{ fontWeight: 700, color: '#22c55e' }}>${bid.bid_amount?.toLocaleString()}</td>
                          <td>
                            <span style={{
                              padding: '2px 8px', borderRadius: '10px', fontSize: '0.7rem', fontWeight: 600,
                              background: bid.status === 'pending' ? 'rgba(59, 130, 246, 0.15)' : bid.status === 'accepted' ? 'rgba(34, 197, 94, 0.15)' : 'rgba(239, 68, 68, 0.15)',
                              color: bid.status === 'pending' ? '#3b82f6' : bid.status === 'accepted' ? '#22c55e' : '#ef4444',
                            }}>
                              {bid.status?.toUpperCase()}
                            </span>
                          </td>
                          <td style={{ fontSize: '0.8rem', color: 'var(--crf-text-muted)' }}>
                            {new Date(bid.created_at).toLocaleDateString()}
                          </td>
                        </tr>
                      )
                    })
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </div>
      )}

      {/* Incoming Bids Section */}
      {activeSection === 'incoming' && (
        <div>
          <div style={{ marginBottom: '16px' }}>
            <p style={{ color: 'var(--crf-text-muted)', fontSize: '0.85rem' }}>
              Review and respond to bids on players you have listed for transfer.
            </p>
          </div>
          <div style={{ display: 'grid', gap: '12px' }}>
            {incomingBids.length === 0 ? (
              <div className="crf-card" style={{ textAlign: 'center', padding: '60px', color: 'var(--crf-text-muted)' }}>
                <Gavel size={40} style={{ marginBottom: '16px', opacity: 0.5 }} />
                <p>No incoming bids on your listed players.</p>
              </div>
            ) : (
              incomingBids.map(bid => {
                const listing = transferListings.find(l => l.id === bid.transfer_listing_id)
                return (
                  <div key={bid.id} className="crf-card" style={{ display: 'flex', gap: '16px', alignItems: 'center', flexWrap: 'wrap' }}>
                    <img src={listing?.player?.roblox_avatar_url || `https://placehold.co/56x56/1e1e3f/666?text=${listing?.player?.roblox_username?.charAt(0)}`} alt="" style={{ width: '56px', height: '56px', borderRadius: '8px', objectFit: 'cover', flexShrink: 0 }} />
                    <div style={{ flex: 1, minWidth: '200px' }}>
                      <div style={{ fontWeight: 700, marginBottom: '2px' }}>{listing?.player?.roblox_username}</div>
                      <div style={{ fontSize: '0.8rem', color: 'var(--crf-text-muted)' }}>
                        Bid from <strong>{bid.manager_username}</strong> ({bid.club})
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--crf-text-muted)', marginTop: '2px' }}>
                        Listed at: ${listing?.asking_price?.toLocaleString()}
                      </div>
                    </div>
                    <div style={{ textAlign: 'right', flexShrink: 0 }}>
                      <div style={{ fontSize: '1.6rem', fontWeight: 800, fontFamily: 'Oswald, sans-serif', color: '#22c55e' }}>
                        ${bid.bid_amount?.toLocaleString()}
                      </div>
                      <div style={{ display: 'flex', gap: '6px', marginTop: '8px' }}>
                        <button
                          onClick={() => handleAcceptBid(bid)}
                          className="crf-btn crf-btn-sm"
                          style={{ padding: '6px 12px', fontSize: '0.8rem', background: 'rgba(34, 197, 94, 0.2)', color: '#22c55e' }}
                        >
                          <CheckCircle size={12} /> Accept
                        </button>
                        <button
                          onClick={() => handleRejectBid(bid)}
                          className="crf-btn crf-btn-sm crf-btn-danger"
                          style={{ padding: '6px 12px', fontSize: '0.8rem' }}
                        >
                          <XCircle size={12} /> Reject
                        </button>
                      </div>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}
    </div>
  )
}

export default ManagerDashboard
