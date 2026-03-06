import { useState } from 'react'
import { AVATARS } from '../avatars'

export default function AvatarSelect({ selected, onSelect, color = 'var(--neon-cyan)' }) {
  return (
    <div style={{ marginBottom: 14 }}>
      <div style={{
        fontFamily: "'Share Tech Mono',monospace",
        fontSize: 10, color: 'var(--dim)',
        letterSpacing: 2, marginBottom: 8
      }}>CHOOSE YOUR FIGHTER</div>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(4, 1fr)',
        gap: 6
      }}>
        {AVATARS.map(av => (
          <div
            key={av.id}
            onClick={() => onSelect(av.id)}
            title={av.name}
            style={{
              padding: '8px 4px',
              textAlign: 'center',
              cursor: 'pointer',
              border: `1px solid ${selected === av.id ? av.color : 'var(--border)'}`,
              background: selected === av.id ? `${av.color}18` : 'transparent',
              transition: 'all 0.15s',
              position: 'relative'
            }}
          >
            <div style={{ fontSize: 24, lineHeight: 1 }}>{av.emoji}</div>
            <div style={{
              fontFamily: "'Share Tech Mono',monospace",
              fontSize: 7,
              color: selected === av.id ? av.color : 'var(--dim)',
              marginTop: 3,
              letterSpacing: 0.5,
              overflow: 'hidden',
              textOverflow: 'ellipsis',
              whiteSpace: 'nowrap'
            }}>{av.name}</div>
            {selected === av.id && (
              <div style={{
                position: 'absolute', top: 2, right: 2,
                width: 6, height: 6,
                background: av.color,
                borderRadius: '50%',
                boxShadow: `0 0 6px ${av.color}`
              }} />
            )}
          </div>
        ))}
      </div>
    </div>
  )
}
