// avatars.js — anime-style SVG character portraits

export const AVATARS = [
  { id: 'rage',     name: 'KAIROS', title: 'The Rage Monster',      color: '#ff1a1a', glow: '#ff000088', desc: 'Pure unfiltered fury' },
  { id: 'veteran',  name: 'VEXON',  title: 'The Street Veteran',    color: '#f59e0b', glow: '#f59e0b88', desc: 'Been through it all' },
  { id: 'genius',   name: 'KIRA',   title: 'The Cold Genius',       color: '#00e5ff', glow: '#00e5ff88', desc: 'Calm but lethal' },
  { id: 'demon',    name: 'VAEL',   title: 'The Demon Entity',      color: '#9b1dff', glow: '#9b1dff88', desc: 'Ancient dark power' },
  { id: 'wildcard', name: 'JINX',   title: 'The Unhinged Wildcard', color: '#ff00cc', glow: '#ff00cc88', desc: 'Completely unpredictable' },
  { id: 'villain',  name: 'MOROS',  title: 'The Villain With Class',color: '#c0c0c0', glow: '#c0c0c088', desc: 'Evil in a suit' },
  { id: 'ghost',    name: 'NULL',   title: 'The Ghost Assassin',    color: '#00ffaa', glow: '#00ffaa88', desc: 'You never see it coming' },
  { id: 'gay',      name: 'BLAZE',  title: 'Gay Monster',           color: '#ff6ec7', glow: '#ff6ec788', desc: 'Fabulous and ferocious' },
]

export function getAvatar(id) {
  return AVATARS.find(a => a.id === id) || AVATARS[0]
}

// ─── SVG PORTRAIT RENDERER ────────────────────────────────────────────────────
export function getAvatarSVG(id, size = 80) {
  const fn = { rage: rageSVG, veteran: veteranSVG, genius: geniusSVG, demon: demonSVG, wildcard: wildcardSVG, villain: villainSVG, ghost: ghostSVG, gay: gaySVG }
  return (fn[id] || rageSVG)(size)
}

// ─── KAIROS — The Rage Monster ────────────────────────────────────────────────
function rageSVG(s) {
  return `<svg width="${s}" height="${s}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="rg_bg" cx="50%" cy="60%" r="55%"><stop offset="0%" stop-color="#3a0000"/><stop offset="100%" stop-color="#0d0000"/></radialGradient>
    <radialGradient id="rg_skin" cx="50%" cy="40%" r="55%"><stop offset="0%" stop-color="#c8704a"/><stop offset="100%" stop-color="#8b3a1a"/></radialGradient>
    <filter id="rg_glow"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="100" height="100" fill="url(#rg_bg)"/>
  <ellipse cx="50" cy="12" rx="28" ry="10" fill="#ff3300" opacity="0.4" filter="url(#rg_glow)"/>
  <ellipse cx="35" cy="8" rx="10" ry="6" fill="#ff6600" opacity="0.5"/>
  <ellipse cx="65" cy="9" rx="8" ry="5" fill="#ff4400" opacity="0.4"/>
  <polygon points="30,48 22,15 38,40" fill="#1a0000"/>
  <polygon points="38,44 33,8 46,38" fill="#200000"/>
  <polygon points="50,42 48,5 58,38" fill="#1a0000"/>
  <polygon points="60,44 62,10 70,40" fill="#200000"/>
  <polygon points="68,48 74,18 76,44" fill="#1a0000"/>
  <rect x="42" y="74" width="16" height="12" fill="url(#rg_skin)"/>
  <ellipse cx="50" cy="60" rx="22" ry="24" fill="url(#rg_skin)"/>
  <ellipse cx="50" cy="78" rx="14" ry="8" fill="#8b3a1a" opacity="0.4"/>
  <path d="M28 50 Q33 44 40 48" stroke="#1a0000" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <path d="M72 50 Q67 44 60 48" stroke="#1a0000" stroke-width="3.5" fill="none" stroke-linecap="round"/>
  <ellipse cx="37" cy="56" rx="5" ry="4" fill="#ff0000" filter="url(#rg_glow)"/>
  <ellipse cx="63" cy="56" rx="5" ry="4" fill="#ff0000" filter="url(#rg_glow)"/>
  <ellipse cx="37" cy="56" rx="2.5" ry="2.5" fill="#fff"/>
  <ellipse cx="63" cy="56" rx="2.5" ry="2.5" fill="#fff"/>
  <path d="M47 62 Q50 66 53 62" stroke="#6b2a0a" stroke-width="1.5" fill="none"/>
  <path d="M40 72 Q50 79 60 72" fill="#cc2200" opacity="0.8"/>
  <path d="M38 71 Q50 78 62 71" stroke="#6b2a0a" stroke-width="1.5" fill="none"/>
  <line x1="44" y1="72" x2="44" y2="77" stroke="#fff" stroke-width="1"/>
  <line x1="48" y1="73" x2="48" y2="78" stroke="#fff" stroke-width="1"/>
  <line x1="52" y1="73" x2="52" y2="78" stroke="#fff" stroke-width="1"/>
  <line x1="56" y1="72" x2="56" y2="77" stroke="#fff" stroke-width="1"/>
  <line x1="55" y1="52" x2="60" y2="62" stroke="#6b1a00" stroke-width="1.5" opacity="0.7"/>
  <path d="M28 88 Q50 82 72 88 L72 100 L28 100 Z" fill="#1a0000"/>
  <path d="M42 88 L50 96 L58 88" fill="#cc0000"/>
</svg>`
}

// ─── VEXON — The Street Veteran ───────────────────────────────────────────────
function veteranSVG(s) {
  return `<svg width="${s}" height="${s}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="vx_bg" cx="50%" cy="50%" r="55%"><stop offset="0%" stop-color="#1a1200"/><stop offset="100%" stop-color="#0a0800"/></radialGradient>
    <radialGradient id="vx_skin" cx="50%" cy="40%" r="55%"><stop offset="0%" stop-color="#7a4a2a"/><stop offset="100%" stop-color="#4a2a10"/></radialGradient>
  </defs>
  <rect width="100" height="100" fill="url(#vx_bg)"/>
  <path d="M20 100 L20 78 Q50 68 80 78 L80 100 Z" fill="#1c1c1c"/>
  <path d="M22 55 Q22 30 50 26 Q78 30 78 55 Q78 70 68 76 Q50 72 32 76 Q22 70 22 55Z" fill="#222"/>
  <path d="M30 50 Q30 33 50 30 Q70 33 70 50 Q70 64 63 70 Q50 66 37 70 Q30 64 30 50Z" fill="#2a2a2a"/>
  <ellipse cx="50" cy="56" rx="19" ry="21" fill="url(#vx_skin)"/>
  <path d="M32 48 L44 58" stroke="#3a1a05" stroke-width="2" opacity="0.8"/>
  <path d="M33 48 L45 58" stroke="#5a2a0a" stroke-width="1" opacity="0.5"/>
  <ellipse cx="40" cy="52" rx="5" ry="3" fill="#0a0a0a"/>
  <ellipse cx="60" cy="52" rx="5" ry="3" fill="#0a0a0a"/>
  <ellipse cx="40" cy="52" rx="3" ry="2" fill="#f59e0b"/>
  <ellipse cx="60" cy="52" rx="3" ry="2" fill="#f59e0b"/>
  <ellipse cx="40" cy="52" rx="1.5" ry="1.5" fill="#0a0a0a"/>
  <ellipse cx="60" cy="52" rx="1.5" ry="1.5" fill="#0a0a0a"/>
  <rect x="34" y="47" width="12" height="3" rx="1.5" fill="#1a0a00" transform="rotate(-5 40 48)"/>
  <rect x="54" y="47" width="12" height="3" rx="1.5" fill="#1a0a00" transform="rotate(5 60 48)"/>
  <path d="M46 60 Q50 64 54 60" stroke="#3a1a05" stroke-width="2" fill="none"/>
  <ellipse cx="46" cy="61" rx="3" ry="2" fill="#4a2a10" opacity="0.6"/>
  <ellipse cx="54" cy="61" rx="3" ry="2" fill="#4a2a10" opacity="0.6"/>
  <path d="M40 68 Q50 72 60 68" stroke="#3a1a05" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M35 78 Q50 84 65 78" stroke="#f59e0b" stroke-width="2" fill="none" stroke-dasharray="3,2"/>
  <circle cx="50" cy="82" r="3" fill="#f59e0b"/>
  <path d="M30 46 Q30 28 50 26 Q70 28 70 46" fill="#111" stroke="#333" stroke-width="1"/>
  <rect x="29" y="43" width="42" height="5" fill="#1a1a1a" rx="1"/>
  <rect x="29" y="43" width="42" height="2" fill="#f59e0b" opacity="0.6"/>
</svg>`
}

// ─── KIRA — The Cold Genius ───────────────────────────────────────────────────
function geniusSVG(s) {
  return `<svg width="${s}" height="${s}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="kg_bg" cx="50%" cy="50%" r="55%"><stop offset="0%" stop-color="#001a2a"/><stop offset="100%" stop-color="#000a10"/></radialGradient>
    <radialGradient id="kg_skin" cx="50%" cy="40%" r="55%"><stop offset="0%" stop-color="#e8d5c0"/><stop offset="100%" stop-color="#c4a882"/></radialGradient>
    <filter id="kg_glow"><feGaussianBlur stdDeviation="1.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="100" height="100" fill="url(#kg_bg)"/>
  <text x="5" y="20" font-size="6" fill="#00e5ff" opacity="0.15" font-family="monospace">01001011</text>
  <text x="60" y="35" font-size="5" fill="#00e5ff" opacity="0.1" font-family="monospace">110100</text>
  <path d="M26 44 Q24 70 28 90 L34 88 Q32 68 34 48Z" fill="#0a0a0a"/>
  <path d="M74 44 Q76 70 72 90 L66 88 Q68 68 66 48Z" fill="#0a0a0a"/>
  <path d="M28 44 Q28 20 50 18 Q72 20 72 44 Q72 26 50 24 Q28 26 28 44Z" fill="#0a0a0a"/>
  <rect x="43" y="74" width="14" height="12" fill="url(#kg_skin)"/>
  <path d="M30 52 Q30 34 50 32 Q70 34 70 52 Q70 70 62 76 Q56 80 50 80 Q44 80 38 76 Q30 70 30 52Z" fill="url(#kg_skin)"/>
  <path d="M30 58 Q34 62 38 60" stroke="#c4a882" stroke-width="1" opacity="0.5"/>
  <path d="M70 58 Q66 62 62 60" stroke="#c4a882" stroke-width="1" opacity="0.5"/>
  <path d="M33 50 Q40 46 47 50 Q40 54 33 50Z" fill="#001a2a"/>
  <path d="M53 50 Q60 46 67 50 Q60 54 53 50Z" fill="#001a2a"/>
  <ellipse cx="40" cy="50" rx="3.5" ry="3" fill="#00e5ff" filter="url(#kg_glow)"/>
  <ellipse cx="60" cy="50" rx="3.5" ry="3" fill="#00e5ff" filter="url(#kg_glow)"/>
  <ellipse cx="40" cy="50" rx="2" ry="2" fill="#002a3a"/>
  <ellipse cx="60" cy="50" rx="2" ry="2" fill="#002a3a"/>
  <ellipse cx="41" cy="49" rx="0.8" ry="0.8" fill="#ffffff" opacity="0.9"/>
  <ellipse cx="61" cy="49" rx="0.8" ry="0.8" fill="#ffffff" opacity="0.9"/>
  <line x1="33" y1="45" x2="47" y2="44" stroke="#0a0a0a" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="53" y1="44" x2="67" y2="45" stroke="#0a0a0a" stroke-width="1.5" stroke-linecap="round"/>
  <path d="M48 58 Q50 61 52 58" stroke="#c4a882" stroke-width="1.2" fill="none"/>
  <path d="M40 68 Q50 70 60 67" stroke="#8b6a4a" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <rect x="32" y="46" width="16" height="9" rx="4" stroke="#00e5ff" stroke-width="1.2" fill="none" opacity="0.8" filter="url(#kg_glow)"/>
  <rect x="52" y="46" width="16" height="9" rx="4" stroke="#00e5ff" stroke-width="1.2" fill="none" opacity="0.8" filter="url(#kg_glow)"/>
  <line x1="48" y1="50" x2="52" y2="50" stroke="#00e5ff" stroke-width="1" opacity="0.8"/>
  <path d="M30 88 Q50 80 70 88 L72 100 L28 100 Z" fill="#0a1a22"/>
  <rect x="38" y="80" width="24" height="8" rx="4" fill="#0a1a22"/>
</svg>`
}

// ─── VAEL — The Demon Entity ──────────────────────────────────────────────────
function demonSVG(s) {
  return `<svg width="${s}" height="${s}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="dm_bg" cx="50%" cy="50%" r="55%"><stop offset="0%" stop-color="#1a0030"/><stop offset="100%" stop-color="#06000f"/></radialGradient>
    <radialGradient id="dm_skin" cx="50%" cy="40%" r="55%"><stop offset="0%" stop-color="#3a1a5a"/><stop offset="100%" stop-color="#1a0830"/></radialGradient>
    <filter id="dm_glow"><feGaussianBlur stdDeviation="2.5" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="100" height="100" fill="url(#dm_bg)"/>
  <path d="M20 100 Q15 60 25 30" stroke="#9b1dff" stroke-width="1" fill="none" opacity="0.3"/>
  <path d="M80 100 Q85 60 75 30" stroke="#9b1dff" stroke-width="1" fill="none" opacity="0.3"/>
  <path d="M50 0 Q55 20 50 40" stroke="#9b1dff" stroke-width="1.5" fill="none" opacity="0.4" filter="url(#dm_glow)"/>
  <path d="M32 38 Q24 16 30 8 Q36 20 36 38" fill="#1a0830" stroke="#9b1dff" stroke-width="0.5"/>
  <path d="M68 38 Q76 16 70 8 Q64 20 64 38" fill="#1a0830" stroke="#9b1dff" stroke-width="0.5"/>
  <path d="M33 34 Q28 18 31 11" stroke="#9b1dff" stroke-width="0.8" fill="none" opacity="0.6" filter="url(#dm_glow)"/>
  <path d="M67 34 Q72 18 69 11" stroke="#9b1dff" stroke-width="0.8" fill="none" opacity="0.6" filter="url(#dm_glow)"/>
  <path d="M28 44 Q20 60 22 90" stroke="#0f0018" stroke-width="12" fill="none" stroke-linecap="round"/>
  <path d="M72 44 Q80 60 78 90" stroke="#0f0018" stroke-width="12" fill="none" stroke-linecap="round"/>
  <ellipse cx="50" cy="36" rx="24" ry="10" fill="#0f0018"/>
  <rect x="43" y="74" width="14" height="10" fill="url(#dm_skin)"/>
  <path d="M28 52 Q28 34 50 32 Q72 34 72 52 Q72 70 62 78 Q56 82 50 82 Q44 82 38 78 Q28 70 28 52Z" fill="url(#dm_skin)"/>
  <path d="M30 56 Q36 60 34 66" stroke="#9b1dff" stroke-width="1.2" fill="none" opacity="0.7" filter="url(#dm_glow)"/>
  <path d="M70 56 Q64 60 66 66" stroke="#9b1dff" stroke-width="1.2" fill="none" opacity="0.7" filter="url(#dm_glow)"/>
  <path d="M46 36 Q50 32 54 36 Q52 40 50 38 Q48 40 46 36Z" fill="#9b1dff" opacity="0.8" filter="url(#dm_glow)"/>
  <ellipse cx="38" cy="52" rx="7" ry="5" fill="#0a0018"/>
  <ellipse cx="62" cy="52" rx="7" ry="5" fill="#0a0018"/>
  <ellipse cx="38" cy="52" rx="5" ry="4" fill="#9b1dff" filter="url(#dm_glow)"/>
  <ellipse cx="62" cy="52" rx="5" ry="4" fill="#9b1dff" filter="url(#dm_glow)"/>
  <ellipse cx="38" cy="52" rx="1.5" ry="4" fill="#0a0018"/>
  <ellipse cx="62" cy="52" rx="1.5" ry="4" fill="#0a0018"/>
  <path d="M30 46 Q38 42 44 47" stroke="#0f0018" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M70 46 Q62 42 56 47" stroke="#0f0018" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M47 60 Q50 63 53 60" stroke="#2a0a4a" stroke-width="1.5" fill="none"/>
  <path d="M38 71 Q50 80 62 71" fill="#6600aa" opacity="0.6"/>
  <path d="M36 70 Q50 80 64 70" stroke="#2a0a4a" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <polygon points="46,72 43,78 49,72" fill="#e0d0ff" opacity="0.9"/>
  <polygon points="54,72 57,78 51,72" fill="#e0d0ff" opacity="0.9"/>
  <path d="M22 90 Q50 82 78 90 L80 100 L20 100 Z" fill="#0f0018"/>
  <path d="M38 82 Q50 92 62 82" stroke="#9b1dff" stroke-width="1" fill="none" opacity="0.6" filter="url(#dm_glow)"/>
</svg>`
}

// ─── JINX — The Unhinged Wildcard ─────────────────────────────────────────────
function wildcardSVG(s) {
  return `<svg width="${s}" height="${s}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="jx_bg" cx="50%" cy="50%" r="55%"><stop offset="0%" stop-color="#1a001a"/><stop offset="100%" stop-color="#080008"/></radialGradient>
    <radialGradient id="jx_skin" cx="50%" cy="40%" r="55%"><stop offset="0%" stop-color="#f0c8d8"/><stop offset="100%" stop-color="#d4a0b8"/></radialGradient>
    <filter id="jx_glow"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="100" height="100" fill="url(#jx_bg)"/>
  <circle cx="15" cy="20" r="2" fill="#ff00cc" opacity="0.6" filter="url(#jx_glow)"/>
  <circle cx="85" cy="15" r="1.5" fill="#ffff00" opacity="0.5"/>
  <circle cx="10" cy="70" r="1" fill="#00ffff" opacity="0.4"/>
  <circle cx="90" cy="75" r="2" fill="#ff00cc" opacity="0.5"/>
  <path d="M20 52 Q10 70 14 90" stroke="#cc00aa" stroke-width="10" fill="none" stroke-linecap="round"/>
  <path d="M80 52 Q90 70 86 90" stroke="#1a00cc" stroke-width="10" fill="none" stroke-linecap="round"/>
  <path d="M26 48 Q26 22 50 20 Q74 22 74 48 Q74 30 50 28 Q26 30 26 48Z" fill="#cc00aa"/>
  <path d="M34 46 Q36 28 44 24" stroke="#1a00cc" stroke-width="3" fill="none" opacity="0.6"/>
  <path d="M54 24 Q62 28 64 46" stroke="#ff00cc" stroke-width="3" fill="none" opacity="0.5"/>
  <rect x="43" y="74" width="14" height="10" fill="url(#jx_skin)"/>
  <ellipse cx="50" cy="56" rx="22" ry="23" fill="url(#jx_skin)"/>
  <ellipse cx="37" cy="52" rx="8" ry="9" fill="#fff"/>
  <ellipse cx="63" cy="52" rx="6" ry="7" fill="#fff"/>
  <ellipse cx="37" cy="53" rx="5" ry="6" fill="#ff00cc"/>
  <ellipse cx="63" cy="53" rx="4" ry="5" fill="#8800ff"/>
  <ellipse cx="37" cy="53" rx="3" ry="3.5" fill="#0a000a"/>
  <ellipse cx="63" cy="53" rx="2.5" ry="3" fill="#0a000a"/>
  <ellipse cx="35" cy="51" rx="1.2" ry="1.2" fill="#fff"/>
  <ellipse cx="62" cy="51" rx="1" ry="1" fill="#fff"/>
  <line x1="59" y1="48" x2="67" y2="56" stroke="#ff00cc" stroke-width="1" opacity="0.8"/>
  <line x1="67" y1="48" x2="59" y2="56" stroke="#ff00cc" stroke-width="1" opacity="0.8"/>
  <path d="M28 44 Q37 38 44 44" stroke="#cc00aa" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M56 43 Q63 40 70 45" stroke="#cc00aa" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M47 61 Q50 64 53 61" stroke="#d4a0b8" stroke-width="1.2" fill="none"/>
  <path d="M32 70 Q50 84 68 70" fill="#cc0066" stroke="#8b0044" stroke-width="1"/>
  <path d="M34 70 Q50 82 66 70" fill="#ff99cc"/>
  <line x1="38" y1="70" x2="38" y2="77" stroke="#fff" stroke-width="2"/>
  <line x1="43" y1="70" x2="43" y2="79" stroke="#fff" stroke-width="2"/>
  <line x1="48" y1="70" x2="48" y2="80" stroke="#fff" stroke-width="2"/>
  <line x1="53" y1="70" x2="53" y2="80" stroke="#fff" stroke-width="2"/>
  <line x1="58" y1="70" x2="58" y2="79" stroke="#fff" stroke-width="2"/>
  <line x1="63" y1="70" x2="63" y2="77" stroke="#fff" stroke-width="2"/>
  <rect x="34" y="80" width="32" height="5" rx="2.5" fill="#1a001a"/>
  <circle cx="50" cy="82" r="2" fill="#ff00cc" filter="url(#jx_glow)"/>
  <path d="M24 100 L24 86 Q50 80 76 86 L76 100 Z" fill="#1a001a"/>
</svg>`
}

// ─── MOROS — The Villain With Class ──────────────────────────────────────────
function villainSVG(s) {
  return `<svg width="${s}" height="${s}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="mv_bg" cx="50%" cy="50%" r="55%"><stop offset="0%" stop-color="#111118"/><stop offset="100%" stop-color="#05050a"/></radialGradient>
    <radialGradient id="mv_skin" cx="50%" cy="40%" r="55%"><stop offset="0%" stop-color="#d8c8b8"/><stop offset="100%" stop-color="#b0a090"/></radialGradient>
  </defs>
  <rect width="100" height="100" fill="url(#mv_bg)"/>
  <line x1="0" y1="20" x2="100" y2="20" stroke="#ffffff" stroke-width="0.3" opacity="0.05"/>
  <line x1="0" y1="40" x2="100" y2="40" stroke="#ffffff" stroke-width="0.3" opacity="0.05"/>
  <line x1="0" y1="60" x2="100" y2="60" stroke="#ffffff" stroke-width="0.3" opacity="0.05"/>
  <path d="M28 44 Q28 20 50 18 Q72 20 72 44 Q68 28 50 26 Q32 28 28 44Z" fill="#0a0a12"/>
  <path d="M28 44 Q32 34 50 32 Q68 34 72 44" fill="#0f0f1a"/>
  <path d="M42 18 Q44 26 46 36" stroke="#1a1a2a" stroke-width="1.5"/>
  <rect x="43" y="74" width="14" height="10" fill="url(#mv_skin)"/>
  <path d="M30 52 Q30 34 50 32 Q70 34 70 52 Q70 70 62 76 Q56 80 50 80 Q44 80 38 76 Q30 70 30 52Z" fill="url(#mv_skin)"/>
  <path d="M32 66 Q38 74 50 76 Q62 74 68 66" stroke="#b0a090" stroke-width="0.8" fill="none" opacity="0.4"/>
  <path d="M32 50 Q40 46 48 50 Q40 54 32 50Z" fill="#0a0a12"/>
  <path d="M52 50 Q60 46 68 50 Q60 54 52 50Z" fill="#0a0a12"/>
  <ellipse cx="40" cy="50" rx="4" ry="3" fill="#c0c0c0"/>
  <ellipse cx="60" cy="50" rx="4" ry="3" fill="#c0c0c0"/>
  <ellipse cx="40" cy="50" rx="2.5" ry="2.5" fill="#0a0a12"/>
  <ellipse cx="60" cy="50" rx="2.5" ry="2.5" fill="#0a0a12"/>
  <ellipse cx="41" cy="49" rx="1" ry="1" fill="#fff" opacity="0.8"/>
  <ellipse cx="61" cy="49" rx="1" ry="1" fill="#fff" opacity="0.8"/>
  <path d="M32 45 Q40 42 48 45" stroke="#0a0a12" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <path d="M52 45 Q60 42 68 45" stroke="#0a0a12" stroke-width="1.8" fill="none" stroke-linecap="round"/>
  <path d="M48 57 L50 62 L52 57" stroke="#b0a090" stroke-width="1.2" fill="none" stroke-linecap="round"/>
  <path d="M40 69 Q50 72 60 69" stroke="#8a7a6a" stroke-width="1.5" fill="none" stroke-linecap="round"/>
  <circle cx="60" cy="50" r="7" stroke="#c0c0c0" stroke-width="1" fill="none" opacity="0.6"/>
  <line x1="67" y1="50" x2="72" y2="46" stroke="#c0c0c0" stroke-width="0.8" opacity="0.5"/>
  <path d="M22 100 L22 82 Q36 76 44 80 L50 86 L56 80 Q64 76 78 82 L78 100 Z" fill="#111118"/>
  <path d="M42 80 L50 86 L58 80 Q56 78 50 76 Q44 78 42 80Z" fill="#e8e8f0"/>
  <path d="M47 80 L50 86 L53 80 L51 76 L49 76 Z" fill="#8a0000"/>
  <path d="M49 86 L50 94 L51 86 Z" fill="#6a0000"/>
  <rect x="24" y="84" width="6" height="4" rx="1" fill="#c0c0c0" opacity="0.7"/>
</svg>`
}

// ─── NULL — The Ghost Assassin ────────────────────────────────────────────────
function ghostSVG(s) {
  return `<svg width="${s}" height="${s}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="gh_bg" cx="50%" cy="50%" r="55%"><stop offset="0%" stop-color="#001a10"/><stop offset="100%" stop-color="#000a06"/></radialGradient>
    <radialGradient id="gh_skin" cx="50%" cy="40%" r="55%"><stop offset="0%" stop-color="#c8e8d8"/><stop offset="100%" stop-color="#90c0a8"/></radialGradient>
    <filter id="gh_glow"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
  </defs>
  <rect width="100" height="100" fill="url(#gh_bg)"/>
  <line x1="0" y1="0" x2="100" y2="100" stroke="#00ffaa" stroke-width="0.3" opacity="0.08"/>
  <line x1="100" y1="0" x2="0" y2="100" stroke="#00ffaa" stroke-width="0.3" opacity="0.08"/>
  <circle cx="50" cy="50" r="40" stroke="#00ffaa" stroke-width="0.5" fill="none" opacity="0.06"/>
  <path d="M26 58 Q26 36 50 34 Q74 36 74 58 Q74 74 64 80 Q56 84 50 84 Q44 84 36 80 Q26 74 26 58Z" fill="#0a1a12"/>
  <path d="M30 50 Q30 34 50 32 Q70 34 70 50 Q70 62 62 66 Q50 68 38 66 Q30 62 30 50Z" fill="url(#gh_skin)"/>
  <path d="M26 58 Q26 52 30 52 Q30 62 38 66 Q50 68 62 66 Q70 62 70 52 Q74 52 74 58 Q74 74 64 80 Q56 84 50 84 Q44 84 36 80 Q26 74 26 58Z" fill="#0d1f16"/>
  <path d="M30 58 Q50 64 70 58" stroke="#00ffaa" stroke-width="0.6" fill="none" opacity="0.4" stroke-dasharray="2,2"/>
  <path d="M28 46 Q28 24 50 22 Q72 24 72 46 Q70 30 50 28 Q30 30 28 46Z" fill="#060e0a"/>
  <path d="M32 46 Q40 42 48 46 Q40 50 32 46Z" fill="#0a1a12"/>
  <path d="M52 46 Q60 42 68 46 Q60 50 52 46Z" fill="#0a1a12"/>
  <ellipse cx="40" cy="46" rx="5" ry="3.5" fill="#00ffaa" filter="url(#gh_glow)"/>
  <ellipse cx="60" cy="46" rx="5" ry="3.5" fill="#00ffaa" filter="url(#gh_glow)"/>
  <ellipse cx="40" cy="46" rx="3" ry="2" fill="#001a10"/>
  <ellipse cx="60" cy="46" rx="3" ry="2" fill="#001a10"/>
  <ellipse cx="41" cy="45" rx="1" ry="1" fill="#fff" opacity="0.7"/>
  <ellipse cx="61" cy="45" rx="1" ry="1" fill="#fff" opacity="0.7"/>
  <path d="M31 41 Q40 38 48 42" stroke="#060e0a" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M52 42 Q60 38 69 41" stroke="#060e0a" stroke-width="2" fill="none" stroke-linecap="round"/>
  <path d="M30 54 Q50 58 70 54" stroke="#00ffaa" stroke-width="1" fill="none" opacity="0.5" filter="url(#gh_glow)"/>
  <path d="M20 100 L20 80 Q36 76 44 80 L50 86 L56 80 Q64 76 80 80 L80 100 Z" fill="#0d1f16"/>
  <rect x="40" y="82" width="20" height="4" rx="2" fill="#0a1a12"/>
  <circle cx="50" cy="84" r="2" fill="#00ffaa" opacity="0.6" filter="url(#gh_glow)"/>
  <rect x="20" y="80" width="8" height="6" rx="1" fill="#00ffaa" opacity="0.2"/>
</svg>`
}

// ─── BLAZE — Gay Monster ──────────────────────────────────────────────────────
function gaySVG(s) {
  return `<svg width="${s}" height="${s}" viewBox="0 0 100 100" xmlns="http://www.w3.org/2000/svg">
  <defs>
    <radialGradient id="bz_bg" cx="50%" cy="50%" r="55%"><stop offset="0%" stop-color="#1a0012"/><stop offset="100%" stop-color="#080006"/></radialGradient>
    <radialGradient id="bz_skin" cx="50%" cy="40%" r="55%"><stop offset="0%" stop-color="#f8d8e8"/><stop offset="100%" stop-color="#e0a8c0"/></radialGradient>
    <filter id="bz_glow"><feGaussianBlur stdDeviation="2" result="blur"/><feMerge><feMergeNode in="blur"/><feMergeNode in="SourceGraphic"/></feMerge></filter>
    <linearGradient id="bz_hair" x1="0%" y1="0%" x2="100%" y2="100%"><stop offset="0%" stop-color="#ff6ec7"/><stop offset="33%" stop-color="#ff9500"/><stop offset="66%" stop-color="#a855f7"/><stop offset="100%" stop-color="#ff6ec7"/></linearGradient>
  </defs>
  <rect width="100" height="100" fill="url(#bz_bg)"/>
  <text x="8" y="18" font-size="8" fill="#ff6ec7" opacity="0.7" filter="url(#bz_glow)">✦</text>
  <text x="82" y="22" font-size="6" fill="#a855f7" opacity="0.6">✦</text>
  <text x="78" y="80" font-size="7" fill="#ff6ec7" opacity="0.5">✦</text>
  <ellipse cx="50" cy="36" rx="30" ry="18" fill="url(#bz_hair)"/>
  <path d="M20 44 Q14 60 18 82" stroke="url(#bz_hair)" stroke-width="14" fill="none" stroke-linecap="round"/>
  <path d="M80 44 Q86 60 82 82" stroke="url(#bz_hair)" stroke-width="14" fill="none" stroke-linecap="round"/>
  <path d="M34 30 Q38 22 46 24" stroke="#fff" stroke-width="1.5" fill="none" opacity="0.4" stroke-linecap="round"/>
  <rect x="43" y="74" width="14" height="10" fill="url(#bz_skin)"/>
  <ellipse cx="50" cy="58" rx="22" ry="23" fill="url(#bz_skin)"/>
  <ellipse cx="34" cy="62" rx="7" ry="4" fill="#ff6ec7" opacity="0.35"/>
  <ellipse cx="66" cy="62" rx="7" ry="4" fill="#ff6ec7" opacity="0.35"/>
  <ellipse cx="38" cy="54" rx="7" ry="6" fill="#fff"/>
  <ellipse cx="62" cy="54" rx="7" ry="6" fill="#fff"/>
  <ellipse cx="38" cy="55" rx="5" ry="4.5" fill="#a855f7"/>
  <ellipse cx="62" cy="55" rx="5" ry="4.5" fill="#ff6ec7"/>
  <ellipse cx="38" cy="55" rx="3" ry="3" fill="#1a0012"/>
  <ellipse cx="62" cy="55" rx="3" ry="3" fill="#1a0012"/>
  <ellipse cx="36" cy="53" rx="1.2" ry="1.2" fill="#fff"/>
  <ellipse cx="60" cy="53" rx="1.2" ry="1.2" fill="#fff"/>
  <path d="M30 50 Q38 46 46 50" stroke="#1a0012" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <path d="M54 50 Q62 46 70 50" stroke="#1a0012" stroke-width="2.5" fill="none" stroke-linecap="round"/>
  <line x1="31" y1="50" x2="29" y2="46" stroke="#1a0012" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="35" y1="48" x2="34" y2="44" stroke="#1a0012" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="45" y1="50" x2="47" y2="46" stroke="#1a0012" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="55" y1="50" x2="53" y2="46" stroke="#1a0012" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="65" y1="48" x2="66" y2="44" stroke="#1a0012" stroke-width="1.5" stroke-linecap="round"/>
  <line x1="69" y1="50" x2="71" y2="46" stroke="#1a0012" stroke-width="1.5" stroke-linecap="round"/>
  <ellipse cx="50" cy="64" rx="2.5" ry="1.5" fill="#e0a8c0" opacity="0.7"/>
  <path d="M36 70 Q50 80 64 70" fill="#ff4488" stroke="#cc2266" stroke-width="0.5"/>
  <path d="M38 70 Q50 79 62 70" fill="#ff99bb"/>
  <ellipse cx="38" cy="70" rx="3" ry="2" fill="#ff4488"/>
  <ellipse cx="62" cy="70" rx="3" ry="2" fill="#ff4488"/>
  <rect x="32" y="80" width="36" height="5" rx="2.5" fill="#1a0012"/>
  <rect x="32" y="80" width="6" height="5" fill="#ff0000" opacity="0.8"/>
  <rect x="38" y="80" width="5" height="5" fill="#ff9500" opacity="0.8"/>
  <rect x="43" y="80" width="5" height="5" fill="#ffff00" opacity="0.8"/>
  <rect x="48" y="80" width="5" height="5" fill="#00cc00" opacity="0.8"/>
  <rect x="53" y="80" width="5" height="5" fill="#0066ff" opacity="0.8"/>
  <rect x="58" y="80" width="6" height="5" fill="#9b00ff" opacity="0.8"/>
  <path d="M26 100 L26 86 Q50 80 74 86 L74 100 Z" fill="#2a0020"/>
  <path d="M38 86 Q50 90 62 86" stroke="#ff6ec7" stroke-width="1" fill="none" opacity="0.5" filter="url(#bz_glow)"/>
</svg>`
}
