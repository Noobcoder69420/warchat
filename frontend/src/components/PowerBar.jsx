// PowerBar.jsx
export function PowerBar({ p1Score, p2Score, p1Name, p2Name }) {
  const total = p1Score + p2Score
  const p1pct = total === 0 ? 50 : Math.round((p1Score / total) * 100)
  const p2pct = 100 - p1pct

  return (
    <div style={{ padding: '6px 0' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Share Tech Mono',monospace", fontSize: 10, marginBottom: 4 }}>
        <span style={{ color: 'var(--neon-cyan)' }}>{p1Name}</span>
        <span style={{ color: 'var(--dim)', letterSpacing: 2 }}>POWER BAR</span>
        <span style={{ color: 'var(--neon-red)' }}>{p2Name}</span>
      </div>
      <div style={{ height: 20, background: 'rgba(255,255,255,0.05)', border: '1px solid var(--border)', position: 'relative', overflow: 'hidden' }}>
        <div style={{
          position: 'absolute', left: 0, top: 0, bottom: 0,
          width: p1pct + '%',
          background: 'linear-gradient(90deg, rgba(0,245,255,0.2), var(--neon-cyan))',
          transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)'
        }} />
        <div style={{
          position: 'absolute', right: 0, top: 0, bottom: 0,
          width: p2pct + '%',
          background: 'linear-gradient(270deg, rgba(255,0,60,0.2), var(--neon-red))',
          transition: 'width 0.6s cubic-bezier(0.34,1.56,0.64,1)'
        }} />
        <div style={{
          position: 'absolute', top: 0, bottom: 0, width: 3,
          left: p1pct + '%', transform: 'translateX(-50%)',
          background: 'var(--neon-yellow)',
          boxShadow: '0 0 8px var(--neon-yellow)',
          transition: 'left 0.6s cubic-bezier(0.34,1.56,0.64,1)',
          zIndex: 2
        }} />
      </div>
      <div style={{ display: 'flex', justifyContent: 'space-between', fontFamily: "'Share Tech Mono',monospace", fontSize: 11, marginTop: 3 }}>
        <span style={{ color: 'var(--neon-cyan)' }}>{p1pct}%</span>
        <span style={{ color: 'var(--neon-red)' }}>{p2pct}%</span>
      </div>
    </div>
  )
}

export default PowerBar
