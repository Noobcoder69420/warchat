import { AVATARS, getAvatarSVG } from '../avatars'

export default function AvatarSelect({ selected, onSelect }) {
  const selAv = AVATARS.find(a => a.id === selected) || AVATARS[0]

  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontFamily: "'Share Tech Mono',monospace",
        fontSize: 10, color: 'var(--dim)',
        letterSpacing: 2, marginBottom: 8,
        display: 'flex', justifyContent: 'space-between', alignItems: 'center'
      }}>
        <span>CHOOSE YOUR FIGHTER</span>
        <span style={{ color: selAv.color, fontSize: 9 }}>{selAv.name} · {selAv.title}</span>
      </div>

      {/* Portrait grid */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 6,
        marginBottom: 8,
      }}>
        {AVATARS.map(av => (
          <div
            key={av.id}
            onPointerDown={e => { e.preventDefault(); onSelect(av.id) }}
            title={`${av.name} — ${av.title}`}
            style={{
              cursor: 'pointer',
              border: `1px solid ${selected === av.id ? av.color : 'rgba(255,255,255,0.08)'}`,
              background: selected === av.id ? `${av.color}14` : 'rgba(255,255,255,0.02)',
              transition: 'all 0.15s',
              position: 'relative',
              overflow: 'hidden',
              boxShadow: selected === av.id ? `0 0 12px ${av.color}44` : 'none',
            }}
          >
            {/* SVG portrait */}
            <div
              style={{ display: 'block', lineHeight: 0 }}
              dangerouslySetInnerHTML={{ __html: getAvatarSVG(av.id, 80) }}
            />
            {/* Name bar */}
            <div style={{
              background: selected === av.id ? `${av.color}22` : 'rgba(0,0,0,0.5)',
              padding: '3px 4px',
              textAlign: 'center',
            }}>
              <div style={{
                fontFamily: "'Black Ops One',cursive",
                fontSize: 7,
                color: selected === av.id ? av.color : 'var(--dim)',
                letterSpacing: 0.5,
                overflow: 'hidden',
                textOverflow: 'ellipsis',
                whiteSpace: 'nowrap',
              }}>{av.name}</div>
            </div>
            {/* Selected indicator */}
            {selected === av.id && (
              <div style={{
                position: 'absolute', top: 3, right: 3,
                width: 6, height: 6,
                background: av.color,
                borderRadius: '50%',
                boxShadow: `0 0 8px ${av.color}`,
              }} />
            )}
          </div>
        ))}
      </div>

      {/* Selected character info strip */}
      <div style={{
        border: `1px solid ${selAv.color}44`,
        background: `${selAv.color}0a`,
        padding: '6px 10px',
        display: 'flex', alignItems: 'center', gap: 10,
      }}>
        <div
          style={{ flexShrink: 0, lineHeight: 0 }}
          dangerouslySetInnerHTML={{ __html: getAvatarSVG(selAv.id, 36) }}
        />
        <div>
          <div style={{
            fontFamily: "'Black Ops One',cursive",
            fontSize: 11, color: selAv.color, letterSpacing: 1,
          }}>{selAv.name}</div>
          <div style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: 8, color: 'var(--dim)', letterSpacing: 0.5, marginTop: 1,
          }}>{selAv.title}</div>
          <div style={{
            fontFamily: "'Share Tech Mono',monospace",
            fontSize: 7, color: selAv.color, opacity: 0.7, marginTop: 1,
          }}>{selAv.desc}</div>
        </div>
      </div>
    </div>
  )
}
