const ROUNDS_TO_WIN = 3

export default function RoundHUD({ round, timer, p1RoundWins, p2RoundWins }) {
  const urgent = timer <= 10

  const dots = (wins, side) =>
    Array.from({ length: ROUNDS_TO_WIN }, (_, i) => (
      <div key={i} style={{
        width: 10, height: 10,
        border: `1px solid ${i < wins ? (side === 'p1' ? 'var(--neon-cyan)' : 'var(--neon-red)') : 'var(--dim)'}`,
        background: i < wins ? (side === 'p1' ? 'var(--neon-cyan)' : 'var(--neon-red)') : 'transparent'
      }} />
    ))

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '8px 14px',
      background: 'var(--panel)',
      border: '1px solid var(--border)'
    }}>
      <div>
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: 'var(--dim)', letterSpacing: 2 }}>ROUND</div>
        <div style={{ fontFamily: "'Black Ops One',cursive", fontSize: 18, color: 'var(--neon-yellow)' }}>{round}</div>
      </div>

      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
        <div style={{ display: 'flex', gap: 4, alignItems: 'center' }}>
          {dots(p1RoundWins, 'p1')}
          <div style={{ width: 6, height: 10, background: 'var(--dim)', margin: '0 2px' }} />
          {dots(p2RoundWins, 'p2')}
        </div>
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 9, color: 'var(--dim)', letterSpacing: 2 }}>BEST OF 5</div>
      </div>

      <div style={{ textAlign: 'right' }}>
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 10, color: 'var(--dim)', letterSpacing: 2 }}>TIME</div>
        <div style={{
          fontFamily: "'Black Ops One',cursive",
          fontSize: 28,
          color: urgent ? 'var(--neon-red)' : 'var(--neon-yellow)',
          textShadow: urgent ? '0 0 15px var(--neon-red)' : '0 0 15px var(--neon-yellow)',
          lineHeight: 1,
          animation: urgent ? 'pulse 0.5s ease infinite' : 'none'
        }}>
          {timer}
        </div>
      </div>

      <style>{`@keyframes pulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )
}
