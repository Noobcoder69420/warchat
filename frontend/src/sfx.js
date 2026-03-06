// sfx.js — Web Audio API sound engine, zero external files

let ctx = null

function getCtx() {
  if (!ctx) ctx = new (window.AudioContext || window.webkitAudioContext)()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

function playTone({ freq = 440, type = 'sine', duration = 0.15, gain = 0.3, decay = true, delay = 0 }) {
  try {
    const c = getCtx()
    const osc = c.createOscillator()
    const gainNode = c.createGain()
    osc.connect(gainNode)
    gainNode.connect(c.destination)
    osc.type = type
    osc.frequency.setValueAtTime(freq, c.currentTime + delay)
    gainNode.gain.setValueAtTime(gain, c.currentTime + delay)
    if (decay) gainNode.gain.exponentialRampToValueAtTime(0.001, c.currentTime + delay + duration)
    osc.start(c.currentTime + delay)
    osc.stop(c.currentTime + delay + duration)
  } catch (e) {}
}

function playNoise({ duration = 0.1, gain = 0.2, filterFreq = 800 }) {
  try {
    const c = getCtx()
    const bufferSize = c.sampleRate * duration
    const buffer = c.createBuffer(1, bufferSize, c.sampleRate)
    const data = buffer.getChannelData(0)
    for (let i = 0; i < bufferSize; i++) data[i] = Math.random() * 2 - 1
    const source = c.createBufferSource()
    source.buffer = buffer
    const filter = c.createBiquadFilter()
    filter.type = 'bandpass'
    filter.frequency.value = filterFreq
    const gainNode = c.createGain()
    gainNode.gain.setValueAtTime(gain, c.currentTime)
    gainNode.gain.exponentialRampToValueAtTime(0.001, c.currentTime + duration)
    source.connect(filter)
    filter.connect(gainNode)
    gainNode.connect(c.destination)
    source.start()
    source.stop(c.currentTime + duration)
  } catch (e) {}
}

export const sfx = {
  // Unlock audio context on first user interaction
  unlock() { try { getCtx() } catch (e) {} },

  // Round countdown beeps
  countdownBeep(n) {
    if (n > 0) {
      playTone({ freq: 440, type: 'sine', duration: 0.12, gain: 0.4 })
    }
  },

  // FIGHT! sound
  fight() {
    playTone({ freq: 220, type: 'sawtooth', duration: 0.08, gain: 0.5 })
    playTone({ freq: 440, type: 'sawtooth', duration: 0.08, gain: 0.5, delay: 0.08 })
    playTone({ freq: 880, type: 'sawtooth', duration: 0.2, gain: 0.6, delay: 0.16 })
  },

  // Message sent whoosh
  messageSent() {
    playTone({ freq: 600, type: 'sine', duration: 0.08, gain: 0.15 })
    playTone({ freq: 900, type: 'sine', duration: 0.06, gain: 0.1, delay: 0.05 })
  },

  // Weak hit (score < 12)
  hitWeak() {
    playNoise({ duration: 0.08, gain: 0.15, filterFreq: 400 })
    playTone({ freq: 180, type: 'square', duration: 0.1, gain: 0.2 })
  },

  // Medium hit (score 12-20)
  hitMedium() {
    playNoise({ duration: 0.12, gain: 0.25, filterFreq: 800 })
    playTone({ freq: 220, type: 'square', duration: 0.15, gain: 0.3 })
    playTone({ freq: 440, type: 'sine', duration: 0.1, gain: 0.2, delay: 0.05 })
  },

  // Heavy hit (score > 20)
  hitHeavy() {
    playNoise({ duration: 0.18, gain: 0.4, filterFreq: 600 })
    playTone({ freq: 100, type: 'sawtooth', duration: 0.25, gain: 0.5 })
    playTone({ freq: 200, type: 'square', duration: 0.2, gain: 0.35, delay: 0.05 })
    playTone({ freq: 400, type: 'sine', duration: 0.15, gain: 0.25, delay: 0.1 })
  },

  // Fatal strike (score >= 25)
  hitFatal() {
    playNoise({ duration: 0.25, gain: 0.5, filterFreq: 500 })
    playTone({ freq: 80, type: 'sawtooth', duration: 0.3, gain: 0.6 })
    playTone({ freq: 160, type: 'square', duration: 0.25, gain: 0.45, delay: 0.05 })
    playTone({ freq: 320, type: 'sine', duration: 0.2, gain: 0.3, delay: 0.1 })
    playTone({ freq: 640, type: 'sine', duration: 0.15, gain: 0.2, delay: 0.15 })
  },

  // Round end bell
  roundEnd() {
    playTone({ freq: 523, type: 'sine', duration: 0.8, gain: 0.4 })
    playTone({ freq: 659, type: 'sine', duration: 0.6, gain: 0.3, delay: 0.15 })
    playTone({ freq: 784, type: 'sine', duration: 0.5, gain: 0.25, delay: 0.3 })
  },

  // Win fanfare
  win() {
    [523, 659, 784, 1047].forEach((f, i) => {
      playTone({ freq: f, type: 'sine', duration: 0.25, gain: 0.4, delay: i * 0.12 })
    })
  },

  // Lose sound
  lose() {
    [400, 300, 200, 150].forEach((f, i) => {
      playTone({ freq: f, type: 'sawtooth', duration: 0.3, gain: 0.3, delay: i * 0.15 })
    })
  },

  // Timer urgent tick
  tick() {
    playTone({ freq: 880, type: 'square', duration: 0.05, gain: 0.2 })
  },

  // Score points ticking up
  scoreUp() {
    playTone({ freq: 1200, type: 'sine', duration: 0.04, gain: 0.1 })
  },

  // Crowd cheer (noise burst)
  crowdCheer() {
    playNoise({ duration: 0.4, gain: 0.12, filterFreq: 1200 })
    playNoise({ duration: 0.3, gain: 0.08, filterFreq: 2400 })
  },

  // Crowd boo
  crowdBoo() {
    playNoise({ duration: 0.5, gain: 0.1, filterFreq: 300 })
    playTone({ freq: 150, type: 'sawtooth', duration: 0.4, gain: 0.15 })
  },

  // Play hit sound based on score total
  hitByScore(total) {
    if (total >= 25) this.hitFatal()
    else if (total >= 20) this.hitHeavy()
    else if (total >= 13) this.hitMedium()
    else this.hitWeak()
  }
}

export default sfx
