export default function FighterCard({ name, score, side, isMe }) {
  const color = side === 'p1' ? 'var(--neon-cyan)' : 'var(--neon-red)'
  const borderSide = side === 'p1' ? { borderLeft: `3px solid ${color}` } : { borderRight: `3px solid ${color}` }
  const bg = side === 'p1'
    ? 'linear-gradient(135deg, rgba(0,245,255,0.07), transparent)'
    : 'linear-gradient(225deg, rgba(255,0,60,0.07), transparent)'

  return (
    <div style={{
      padding: '10px 14px',
      background: bg,
      textAlign: side === 'p2' ? 'right' : 'left',
      ...borderSide
    }}>
      <div style={{
        fontFamily: "'Black Ops One', cursive",
        fontSize: 'clamp(13px, 3vw, 19px)',
        color,
        lineHeight: 1,
      }}>
        {name || '---'}
        {isMe && <span style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: 'var(--dim)', marginLeft: 6 }}>[YOU]</span>}
      </div>
      <div style={{
        fontFamily: "'Share Tech Mono',monospace",
        fontSize: 11,
        color: 'var(--dim)',
        marginTop: 3
      }}>
        SCORE: <span style={{ color }}>{score}</span>
      </div>
    </div>
  )
}
