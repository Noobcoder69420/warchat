// avatars.js — pixel art JPEG character portraits

export const AVATARS = [
  { id: 'rage',     name: 'KAIROS',      title: 'The Rage Monster',      color: '#ff1a1a', glow: '#ff000088', desc: 'Pure unfiltered fury' },
  { id: 'veteran',  name: 'VEXON',       title: 'The Street Veteran',    color: '#f59e0b', glow: '#f59e0b88', desc: 'Been through it all' },
  { id: 'genius',   name: 'KIRA',        title: 'The Cold Genius',       color: '#00e5ff', glow: '#00e5ff88', desc: 'Calm but lethal' },
  { id: 'demon',    name: 'VAEL',        title: 'The Demon Entity',      color: '#9b1dff', glow: '#9b1dff88', desc: 'Ancient dark power' },
  { id: 'wildcard', name: 'JINX',        title: 'The Unhinged Wildcard', color: '#ff00cc', glow: '#ff00cc88', desc: 'Completely unpredictable' },
  { id: 'villain',  name: 'GOTHIC KISS', title: 'The Ghost Assassin',    color: '#cc0000', glow: '#cc000088', desc: 'Silent and deadly' },
  { id: 'ghost',    name: 'NULL',        title: 'The Ice Sovereign',     color: '#00ffaa', glow: '#00ffaa88', desc: 'You never see it coming' },
  { id: 'gay',      name: 'LORE',        title: 'The Keyhole Keeper',    color: '#f0a800', glow: '#f0a80088', desc: 'Knows everything about you' },
]

export function getAvatar(id) {
  return AVATARS.find(a => a.id === id) || AVATARS[0]
}

// ─── JPEG PORTRAIT RENDERER ───────────────────────────────────────────────────
// object-position: top center keeps the face/chest in frame at any square size
export function getAvatarSVG(id, size = 80) {
  return `<img src="/avatars/${id}.jpg" width="${size}" height="${size}" style="object-fit:cover;object-position:top center;display:block;image-rendering:pixelated;" alt="${id}" />`
}
