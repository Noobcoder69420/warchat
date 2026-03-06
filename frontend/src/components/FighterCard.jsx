import { getAvatarSVG } from '../avatars'

export default function FighterCard({ name, score, side, isMe, avatar }) {
  const color = side === 'p1' ? 'var(--neon-cyan)' : 'var(--neon-red)'
  const borderSide = side === 'p1' ? { borderLeft: `3px solid ${color}` } : { borderRight: `3px solid ${color}` }
  const bg = side === 'p1'
    ? 'linear-gradient(135deg, rgba(0,245,255,0.07), transparent)'
    : 'linear-gradient(225deg, rgba(255,0,60,0.07), transparent)'

  return (
    <div style={{
      padding: '8px 12px', background: bg,
      textAlign: side === 'p2' ? 'right' : 'left',
      ...borderSide, display: 'flex',
      flexDirection: side === 'p2' ? 'row-reverse' : 'row',
      alignItems: 'center', gap: 8
    }}>
      {/* SVG Portrait */}
      <div style={{
        width: 44, height: 44, flexShrink: 0,
        border: `1px solid ${avatar?.color || color}`,
        boxShadow: `0 0 10px ${avatar?.color || color}50`,
        overflow: 'hidden', lineHeight: 0,
      }}
        dangerouslySetInnerHTML={{ __html: getAvatarSVG(avatar?.id || 'rage', 44) }}
      />

      <div>
        <div style={{
          fontFamily: "'Black Ops One',cursive",
          fontSize: 'clamp(11px, 2.5vw, 17px)',
          color, lineHeight: 1
        }}>
          {name || '---'}
          {isMe && <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: 'var(--dim)', marginLeft: 5 }}>[YOU]</span>}
        </div>
        {avatar && (
          <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: avatar.color, marginTop: 2, letterSpacing: 1 }}>
            {avatar.name}
          </div>
        )}
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: 'var(--dim)', marginTop: 2 }}>
          SCORE: <span style={{ color }}>{score}</span>
        </div>
      </div>
    </div>
  )
}
