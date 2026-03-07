import { useEffect, useRef } from 'react'
import { getAvatarSVG, getAvatar } from '../avatars'
import sfx from '../sfx'

const TAG_COLORS = {
  aura:       { color: 'var(--neon-purple)', bg: 'rgba(191,0,255,0.1)',  border: 'var(--neon-purple)' },
  damage:     { color: 'var(--neon-red)',    bg: 'rgba(255,0,60,0.1)',   border: 'var(--neon-red)'    },
  creativity: { color: 'var(--neon-green)',  bg: 'rgba(0,255,136,0.1)', border: 'var(--neon-green)'  },
  total:      { color: 'var(--neon-yellow)', bg: 'rgba(255,230,0,0.1)', border: 'var(--neon-yellow)' },
}

const SCORE_TIPS = {
  aura:       ['Confidence & delivery', 'How hard you sold it', 'Style points'],
  damage:     ['Sting of the insult', 'How much it hurt', 'Impact level'],
  creativity: ['Originality & wordplay', 'How fresh the burn was', 'Creative execution'],
}

function ScoreTag({ label, value, type, tip }) {
  const c = TAG_COLORS[type] || TAG_COLORS.total
  return (
    <span
      title={tip}
      style={{
        fontFamily: "'Share Tech Mono',monospace",
        fontSize: 9, padding: '2px 6px',
        color: c.color, background: c.bg,
        border: `1px solid ${c.border}`,
        letterSpacing: 1, whiteSpace: 'nowrap',
        cursor: tip ? 'help' : 'default',
        position: 'relative'
      }}
    >
      {label} {value}
      {tip && <span style={{ marginLeft: 3, opacity: 0.6 }}>?</span>}
    </span>
  )
}

function getScoreBar(value, max = 10, color = 'var(--neon-cyan)') {
  const pct = (value / max) * 100
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 4, marginTop: 2 }}>
      <div style={{ width: 60, height: 4, background: 'rgba(255,255,255,0.08)', position: 'relative' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: pct + '%', background: color,
          transition: 'width 0.5s ease',
          boxShadow: `0 0 4px ${color}`
        }} />
      </div>
      <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color, opacity: 0.8 }}>{value}/10</span>
    </div>
  )
}

const prevScores = new Set()

function Message({ msg, myRole }) {
  const isSystem = msg.role === 'system'
  const isMe = msg.role === myRole

  // Play sfx when scores arrive (once per message)
  useEffect(() => {
    if (msg.scores && !prevScores.has(msg.id)) {
      prevScores.add(msg.id)
      sfx.hitByScore(msg.scores.total)
      if (msg.scores.total >= 20) sfx.crowdCheer()
      else if (msg.scores.total < 10) sfx.crowdBoo()
    }
  }, [msg.scores])

  if (isSystem) {
    return (
      <div style={{ display: 'flex', justifyContent: 'center' }}>
        <div style={{
          background: 'rgba(255,230,0,0.05)',
          border: '1px solid rgba(255,230,0,0.2)',
          color: 'var(--neon-yellow)',
          fontFamily: "'Share Tech Mono',monospace",
          fontSize: 10, padding: '5px 12px',
          letterSpacing: 1, maxWidth: '100%', textAlign: 'center'
        }}>{msg.text}</div>
      </div>
    )
  }

  const isP1 = msg.role === 'p1'
  const accentColor = isP1 ? 'var(--neon-cyan)' : 'var(--neon-red)'

  const bubbleStyle = {
    maxWidth: '78%', padding: '8px 12px',
    fontSize: 14, fontWeight: 600, lineHeight: 1.35,
    ...(isP1 ? {
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
    <div style={{ display: 'flex', flexDirection: isP1 ? 'row' : 'row-reverse', gap: 8 }}>
      {/* SVG Portrait bubble */}
      <div style={{
        width: 28, height: 28, flexShrink: 0,
        border: `1px solid ${accentColor}`,
        boxShadow: `0 0 6px ${accentColor}40`,
        overflow: 'hidden', lineHeight: 0,
        alignSelf: 'flex-end',
      }}
        dangerouslySetInnerHTML={{ __html: getAvatarSVG(msg.avatar || (isP1 ? 'rage' : 'skull'), 28) }}
      />

      <div style={bubbleStyle}>
        <div style={{
          fontFamily: "'Share Tech Mono',monospace", fontSize: 9,
          color: accentColor, letterSpacing: 1, marginBottom: 3,
          textAlign: isP1 ? 'left' : 'right'
        }}>{msg.name?.toUpperCase()}</div>

        <div>{msg.text}</div>

        {msg.scoring && (
          <div style={{
            fontFamily: "'Share Tech Mono',monospace", fontSize: 9,
            color: 'var(--dim)', marginTop: 4,
            animation: 'blink 0.8s ease infinite'
          }}>[ JUDGING... ]</div>
        )}

        {msg.scores && (
          <>
            {/* Mini score bars */}
            <div style={{ marginTop: 6, display: 'flex', flexDirection: 'column', gap: 3, alignItems: isP1 ? 'flex-start' : 'flex-end' }}>
              {[
                { key: 'aura',       label: 'AURA',  color: 'var(--neon-purple)', val: msg.scores.aura },
                { key: 'damage',     label: 'DMG',   color: 'var(--neon-red)',    val: msg.scores.damage },
                { key: 'creativity', label: 'OG',    color: 'var(--neon-green)',  val: msg.scores.creativity },
              ].map(({ key, label, color, val }) => (
                <div key={key} style={{ display: 'flex', alignItems: 'center', gap: 5, flexDirection: isP1 ? 'row' : 'row-reverse' }}>
                  <span style={{
                    fontFamily: "'Share Tech Mono',monospace", fontSize: 8,
                    color, letterSpacing: 1, width: 28,
                    textAlign: isP1 ? 'left' : 'right'
                  }}>{label}</span>
                  {getScoreBar(val, 10, color)}
                </div>
              ))}
            </div>

            {/* Total + verdict — slams in */}
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6, marginTop: 5,
              justifyContent: isP1 ? 'flex-start' : 'flex-end'
            }}>
              <span style={{
                fontFamily: "'Share Tech Mono',monospace", fontSize: 9,
                color: msg.scores.total <= 3 ? 'var(--dim)' : 'var(--neon-yellow)',
                border: `1px solid ${msg.scores.total <= 3 ? 'var(--dim)' : 'var(--neon-yellow)'}`,
                background: msg.scores.total <= 3 ? 'transparent' : 'rgba(255,230,0,0.1)',
                padding: '1px 6px', letterSpacing: 1,
                animation: msg.scores.total > 3 ? 'verdictSlam 0.3s cubic-bezier(0.36,0.07,0.19,0.97)' : 'none',
              }}>+{msg.scores.total}pts</span>
              <span style={{
                fontFamily: "'Share Tech Mono',monospace", fontSize: 8,
                color: msg.scores.total <= 3 ? 'var(--dim)' : 'var(--neon-yellow)',
                letterSpacing: 1,
                animation: msg.scores.total > 10 ? 'verdictSlam 0.3s cubic-bezier(0.36,0.07,0.19,0.97)' : 'none',
              }}>» {msg.scores.verdict}</span>
            </div>
            <style>{`
              @keyframes verdictSlam {
                0%   { transform: scale(1.6); opacity: 0; }
                60%  { transform: scale(0.95); opacity: 1; }
                100% { transform: scale(1); }
              }
            `}</style>
          </>
        )}
      </div>
    </div>
  )
}

export default function ChatArea({ messages, myRole, oppTyping, oppName }) {
  const bottomRef = useRef(null)

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages, oppTyping])

  return (
    <div style={{
      flex: 1, minHeight: 220, maxHeight: 340,
      overflowY: 'auto',
      background: 'var(--panel)',
      border: '1px solid var(--border)',
      padding: 10,
      display: 'flex', flexDirection: 'column', gap: 8
    }}>
      <style>{`
        @keyframes blink { 0%,100%{opacity:1} 50%{opacity:0.2} }
        @keyframes msgIn { from{opacity:0;transform:translateY(8px)} to{opacity:1;transform:none} }
        @keyframes typingPulse { 0%,100%{opacity:0.4;transform:scale(0.8)} 50%{opacity:1;transform:scale(1)} }
      `}</style>
      {messages.map(msg => (
        <div key={msg.id} style={{ animation: 'msgIn 0.2s ease' }}>
          <Message msg={msg} myRole={myRole} />
        </div>
      ))}

      {/* Typing indicator — lives inside scroll container, below last message */}
      {oppTyping && (
        <div style={{
          display: 'flex', flexDirection: 'row', gap: 8,
          alignItems: 'center', padding: '4px 0',
          animation: 'msgIn 0.2s ease',
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 3, padding: '6px 10px', background: 'rgba(255,255,255,0.04)', border: '1px solid var(--border)' }}>
            {[0, 1, 2].map(i => (
              <div key={i} style={{
                width: 5, height: 5, borderRadius: '50%',
                background: 'var(--dim)',
                animation: `typingPulse 1s ease ${i * 0.2}s infinite`,
              }} />
            ))}
          </div>
          <span style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: 8, color: 'var(--dim)', letterSpacing: 1,
          }}>{oppName?.toUpperCase()} IS TYPING...</span>
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  )
}
