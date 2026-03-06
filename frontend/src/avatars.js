// avatars.js — avatar definitions
export const AVATARS = [
  { id: 'rage',    emoji: '😤', name: 'RAGE LORD',    color: '#ff003c', desc: 'Pure aggression' },
  { id: 'galaxy',  emoji: '🧠', name: 'BIG BRAIN',    color: '#bf00ff', desc: 'Calculated burns' },
  { id: 'ghost',   emoji: '👻', name: 'GHOST',        color: '#00f5ff', desc: 'Silent assassin' },
  { id: 'demon',   emoji: '😈', name: 'DEMON MODE',   color: '#ff6600', desc: 'Pure evil energy' },
  { id: 'robot',   emoji: '🤖', name: 'CYBER UNIT',   color: '#00ff88', desc: 'Cold and precise' },
  { id: 'clown',   emoji: '🤡', name: 'CLOWN',        color: '#ffe600', desc: 'Chaotic neutral' },
  { id: 'skull',   emoji: '💀', name: 'SKULL KING',   color: '#aaaaaa', desc: 'Death by words' },
  { id: 'fire',    emoji: '🔥', name: 'LIT AF',       color: '#ff4400', desc: 'Always on fire' },
]

export function getAvatar(id) {
  return AVATARS.find(a => a.id === id) || AVATARS[0]
}
