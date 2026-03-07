export default function RoundHUD({ round, timer, p1RoundWins, p2RoundWins, modeLabel, roundsToWin = 3 }) {
  const urgent = timer <= 10

  const dots = (wins, side) =>
    Array.from({ length: roundsToWin }, (_, i) => (
      <div key={i} style={{
        width: 8, height: 8,
        border: `1px solid ${i < wins ? (side === 'p1' ? 'var(--neon-cyan)' : 'var(--neon-red)') : 'var(--dim)'}`,
        background: i < wins ? (side === 'p1' ? 'var(--neon-cyan)' : 'var(--neon-red)') : 'transparent',
        flexShrink: 0,
      }} />
    ))

  return (
    <div style={{
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'space-between',
      padding: '5px 10px',
      background: 'var(--panel)',
      border: '1px solid var(--border)',
      flexShrink: 0,
      gap: 8,
    }}>
      {/* Round number */}
      <div style={{ flexShrink: 0 }}>
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: 'var(--dim)', letterSpacing: 2 }}>RND</div>
        <div style={{ fontFamily: "'Black Ops One',cursive", fontSize: 16, color: 'var(--neon-yellow)', lineHeight: 1 }}>{round}</div>
      </div>

      {/* Win dots + mode — center */}
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 3, flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'nowrap' }}>
          {dots(p1RoundWins, 'p1')}
          <div style={{ width: 4, height: 8, background: 'var(--dim)', margin: '0 2px', flexShrink: 0 }} />
          {dots(p2RoundWins, 'p2')}
        </div>
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: 'var(--dim)', letterSpacing: 1, whiteSpace: 'nowrap' }}>
          {modeLabel || 'STANDARD'}
        </div>
      </div>

      {/* Timer */}
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <div style={{ fontFamily: "'Share Tech Mono',monospace", fontSize: 8, color: 'var(--dim)', letterSpacing: 2 }}>TIME</div>
        <div style={{
          fontFamily: "'Black Ops One',cursive",
          fontSize: 24,
          color: urgent ? 'var(--neon-red)' : 'var(--neon-yellow)',
          textShadow: urgent ? '0 0 12px var(--neon-red)' : '0 0 12px var(--neon-yellow)',
          lineHeight: 1,
          animation: urgent ? 'hudPulse 0.5s ease infinite' : 'none',
        }}>
          {timer}
        </div>
      </div>

      <style>{`@keyframes hudPulse { 0%,100%{opacity:1} 50%{opacity:0.4} }`}</style>
    </div>
  )
}
