import React, { useState, useEffect } from 'react'
import { supabase } from '../hooks/useSupabase'
import LeagueStandings from './LeagueStandings'
import { Trophy, Shield, Loader2 } from 'lucide-react'

const Standings = () => {
  const [activeTab, setActiveTab] = useState('premier_league')
  const [teams, setTeams] = useState({})
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    setLoading(true)
    try {
      const { data, error } = await supabase
        .from('standings')
        .select('*')
        .in('league', ['premier_league', 'serie_a'])
        .order('created_at', { ascending: true })

      if (error) throw error

      const organized = { premier_league: [], serie_a: [] }
      data?.forEach(team => {
        if (organized[team.league]) {
          organized[team.league].push(team)
        }
      })

      setTeams(organized)
    } catch (err) {
      console.error('Error fetching standings:', err)
      setTeams({ premier_league: [], serie_a: [] })
    } finally {
      setLoading(false)
    }
  }

  const tabs = [
    { 
      key: 'premier_league', 
      label: 'Premier League', 
      icon: Shield,
      logo: 'https://cdn.discordapp.com/attachments/1323742382650425415/1526812770526429295/IMG_6816.png?ex=6a5862b3&is=6a571133&hm=15380ed0ab71791b758fb16bee9b4bbd701cbf2480cbaebc3ea283ae621ccb20&',
      themeColor: '#3b82f6',
      accentColor: '#60a5fa',
      uclSpots: 8,
      uelSpots: 8,
    },
    { 
      key: 'serie_a', 
      label: 'Serie A', 
      icon: Trophy,
      logo: 'https://cdn.discordapp.com/attachments/1323742382650425415/1526812795318964244/IMG_6879.png?ex=6a5862b9&is=6a571139&hm=1afc723cf0b8e56f99a969263368d6ad1ca4ee8cb592583f916fcb029f6b1f6d&',
      themeColor: '#1e40af',
      accentColor: '#3b82f6',
      uclSpots: 8,
      uelSpots: 8,
    },
  ]

  const activeTabData = tabs.find(t => t.key === activeTab)

  if (loading) {
    return (
      <div style={{
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        minHeight: '400px',
        flexDirection: 'column',
        gap: '16px',
      }}>
        <Loader2 size={40} style={{ color: 'var(--crf-gold)', animation: 'spin 1s linear infinite' }} />
        <p style={{ color: 'var(--crf-text-muted)', fontSize: '0.9rem' }}>Loading standings...</p>
      </div>
    )
  }

  return (
    <div className="animate-fade-in">
      {/* Page Header */}
      <div style={{ marginBottom: '32px' }}>
        <h1 style={{
          fontFamily: 'Oswald, sans-serif',
          fontSize: '2rem',
          fontWeight: 700,
          color: 'white',
          margin: '0 0 8px 0',
          letterSpacing: '0.05em',
        }}>
          League Standings
        </h1>
        <p style={{
          color: 'var(--crf-text-muted)',
          fontSize: '0.9rem',
          margin: 0,
        }}>
          Live table with automatic sorting by points, goal difference, and goals for
        </p>
      </div>

      {/* Tab Navigation */}
      <div style={{
        display: 'flex',
        gap: '8px',
        marginBottom: '32px',
        flexWrap: 'wrap',
      }}>
        {tabs.map((tab) => {
          const Icon = tab.icon
          const isActive = activeTab === tab.key
          return (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '10px',
                padding: '12px 24px',
                borderRadius: '12px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: 600,
                fontFamily: 'Oswald, sans-serif',
                letterSpacing: '0.03em',
                transition: 'all 0.2s ease',
                background: isActive 
                  ? `linear-gradient(135deg, ${tab.themeColor}40 0%, ${tab.themeColor}20 100%)`
                  : 'rgba(255,255,255,0.03)',
                color: isActive ? 'white' : 'var(--crf-text-muted)',
                borderBottom: isActive ? `3px solid ${tab.themeColor}` : '3px solid transparent',
              }}
              onMouseEnter={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.06)'
                  e.currentTarget.style.color = 'var(--crf-text)'
                }
              }}
              onMouseLeave={(e) => {
                if (!isActive) {
                  e.currentTarget.style.background = 'rgba(255,255,255,0.03)'
                  e.currentTarget.style.color = 'var(--crf-text-muted)'
                }
              }}
            >
              <Icon size={18} />
              <span>{tab.label}</span>
            </button>
          )
        })}
      </div>

      {/* Active Standings Table */}
      <LeagueStandings
        title={activeTabData?.label}
        logo={activeTabData?.logo}
        teams={teams[activeTab] || []}
        themeColor={activeTabData?.themeColor}
        accentColor={activeTabData?.accentColor}
        uclSpots={activeTabData?.uclSpots}
        uelSpots={activeTabData?.uelSpots}
      />
    </div>
  )
}

export default Standings
