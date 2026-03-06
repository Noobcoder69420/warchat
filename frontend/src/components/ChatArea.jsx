import { useEffect, useRef } from 'react'

const TAG_COLORS = {
  aura: { color: 'var(--neon-purple)', bg: 'rgba(191,0,255,0.1)', border: 'var(--neon-purple)' },
  damage: { color: 'var(--neon-red)', bg: 'rgba(255,0,60,0.1)', border: 'var(--neon-red)' },
  creativity: { color: 'var(--neon-green)', bg: 'rgba(0,255,136,0.1)', border: 'var(--neon-green)' },
  total: { color: 'var(--neon-yellow)', bg: 'rgba(255,230,0,0.1)', border: 'var(--neon-yellow)' },
}

function ScoreTag({ label, value, type }) {
  const c = TAG_COLORS[type] || TAG_COLORS.total
  return (
    <span style={{
      fontFamily: "'Share Tech Mono',monospace",
      fontSize: 9,
      padding: '1px 5px',
      color: c.color,
      background: c.bg,
      border: `1px solid ${c.border}`,
      letterSpacing: 1,
      whiteSpace: 'nowrap'
    }}>{label} {value}</span>
  )
}

function Message({ msg, myRole }) {
  const isSystem = msg.role === 'system'
  const isMe = msg.role === myRole

  if (isSystem) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{
          background: 'rgba(255,230,0,0.05)',
          border: '1px solid rgba(255,230,0,0.2)',
          color: 'var(--neon-yellow)',
          fontFamily: "'Share Tech Mono',monospace",
          fontSize: 10,
          padding: '5px 12px',
          letterSpacing: 1,
          maxWidth: '100%',
          textAlign: 'center'
        }}>{msg.text}</div>
      </div>
    )
  }

  const bubbleStyle = {
    maxWidth: '75%',
    padding: '8px 12px',
    fontSize: 14,
    fontWeight: 600,
    lineHeight: 1.35,
    ...(msg.role === 'p1' ? {
      background: 'rgba(0,245,255,0.07)',
      borderLeft: '2px solid var(--neon-cyan)',
      clipPath: 'polygon(0 0, 100% 0, 100% calc(100% - 6px), calc(100% - 6px) 100%, 0 100%)'
    } : {
      background: 'rgba(255,0,60,0.07)',
      borderRight: '2px solid var(--neon-red)',
      clipPath: 'polygon(0 0, 100% 0, 100% 100%, 6px 100%, 0 calc(100% - 6px))',
      textAlign: 'right'
    })
  }

  return (
    <div style={{ display: 'flex', flexDirection: msg.role === 'p2' ? 'row-reverse' : 'row', gap: 8 }}>
      <div style={bubbleStyle}>
        <div style={{
          fontFamily: "'Share Tech Mono',monospace",
          fontSize: 9,
          color: msg.role === 'p1' ? 'var(--neon-cyan)' : 'var(--neon-red)',
          letterSpacing: 1,
          marginBottom: 3,
          textAlign: msg.role === 'p2' ? 'right' : 'left'
        }}>{msg.name?.toUpperCase()}</div>
        <div>{msg.text}</div>

        {msg.scoring && (
          <div style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: 9,
            color: 'var(--dim)',
            marginTop: 4,
            animation: 'blink 0.8s ease infinite'
          }}>[ SCORING... ]</div>
        )}

        {msg.scores && (
          <>
            <div style={{ display: 'flex', gap: 5, marginTop: 5, flexWrap: 'wrap', justifyContent: msg.role === 'p2' ? 'flex-end' : 'flex-start' }}>
              <ScoreTag label="AURA" value={msg.scores.aura} type="aura" />
              <ScoreTag label="DMG" value={msg.scores.damage} type="damage" />
              <ScoreTag label="OG" value={msg.scores.creativity} type="creativity" />
              <ScoreTag label="+" value={msg.scores.total + 'pts'} type="total" />
            </div>
            <div style={{
              fontFamily: "'Share Tech Mono',monospace",
              fontSize: 9,
              color: 'var(--neon-yellow)',
              marginTop: 3,
              letterSpacing: 1,
              textAlign: msg.role === 'p2' ? 'right' : 'left'
            }}>» {msg.scores.verdict}</div>
          </>
        )}
      </div>
    </div>
  )
}

export default function ChatArea({ messages, myRole }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  return (
    <div style={{
      flex: 1,
      minHeight: 220,
      maxHeight: 340,
      overflowY: 'auto',
      background: 'var(--panel)',
      border: '1px solid var(--border)',
      padding: 10,
      display: 'flex',
      flexDirection: 'column',
      gap: 8
    }}>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes msgIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
      `}</style>
      {messages.map(msg => (
        <div key={msg.id} style={{ animation: 'msgIn 0.2s ease' }}>
          <Message msg={msg} myRole={myRole} />
        </div>
      ))}
      <div ref={bottomRef} />
    </div>
  )
}
