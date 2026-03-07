import { getAvatarSVG } from '../avatars'

export default function FighterCard({ name, score, side, isMe, avatar }) {
  const color = side === 'p1' ? 'var(--neon-cyan)' : 'var(--neon-red)'
  const borderSide = side === 'p1' ? { borderLeft: `2px solid ${color}` } : { borderRight: `2px solid ${color}` }
  const bg = side === 'p1'
    ? 'linear-gradient(135deg, rgba(0,245,255,0.07), transparent)'
    : 'linear-gradient(225deg, rgba(255,0,60,0.07), transparent)'

  return (
    <div style={{
      padding: '6px 8px',
      background: bg,
      textAlign: side === 'p2' ? 'right' : 'left',
      ...borderSide,
      display: 'flex',
      flexDirection: side === 'p2' ? 'row-reverse' : 'row',
      alignItems: 'center',
      gap: 6,
      minWidth: 0, /* allow flex shrink */
    }}>
      {/* Avatar portrait */}
      <div style={{
        width: 36, height: 36, flexShrink: 0,
        border: `1px solid ${avatar?.color || color}`,
        boxShadow: `0 0 8px ${avatar?.color || color}50`,
        overflow: 'hidden', lineHeight: 0,
      }}
        dangerouslySetInnerHTML={{ __html: getAvatarSVG(avatar?.id || 'rage', 36) }}
      />

      <div style={{ minWidth: 0 }}>
        <div style={{
          fontFamily: "'Black Ops One',cursive",
          fontSize: 'clamp(10px, 3vw, 16px)',
          color, lineHeight: 1,
          overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {name || '---'}
          {isMe && <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 7, color: 'var(--dim)', marginLeft: 4 }}>[YOU]</span>}
        </div>
        {avatar && (
          <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 7, color: avatar.color, marginTop: 1, letterSpacing: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {avatar.name}
          </div>
        )}
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: 'var(--dim)', marginTop: 2 }}>
          <span style={{ color }}>{score}</span> pts
        </div>
      </div>
    </div>
  )
}
