// sfx.js — Web Audio API sound engine + background music

let ctx = null
let bgGain = null
let bgNodes = []
let bgMuted = false
let bgStarted = false

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

// ─── BACKGROUND MUSIC ─────────────────────────────────────────────────────────
// Procedural dark cyberpunk loop — bass pulse + hi-hat + pad

function startBgMusic() {
  if (bgStarted) return
  bgStarted = true
  try {
    const c = getCtx()
    bgGain = c.createGain()
    bgGain.gain.setValueAtTime(bgMuted ? 0 : 0.12, c.currentTime)
    bgGain.connect(c.destination)

    const BPM = 120
    const beat = 60 / BPM
    const bar = beat * 4

    function scheduleBass(startTime) {
      // Four-on-the-floor kick pattern
      const kicks = [0, beat, beat * 2, beat * 3]
      kicks.forEach(offset => {
        const osc = c.createOscillator()
        const g = c.createGain()
        osc.connect(g); g.connect(bgGain)
        osc.type = 'sine'
        osc.frequency.setValueAtTime(80, startTime + offset)
        osc.frequency.exponentialRampToValueAtTime(30, startTime + offset + 0.15)
        g.gain.setValueAtTime(0.6, startTime + offset)
        g.gain.exponentialRampToValueAtTime(0.001, startTime + offset + 0.25)
        osc.start(startTime + offset)
        osc.stop(startTime + offset + 0.3)
        bgNodes.push(osc)
      })
    }

    function scheduleHihat(startTime) {
      // Offbeat hi-hats
      for (let i = 0; i < 8; i++) {
        const bufSize = c.sampleRate * 0.04
        const buf = c.createBuffer(1, bufSize, c.sampleRate)
        const d = buf.getChannelData(0)
        for (let j = 0; j < bufSize; j++) d[j] = Math.random() * 2 - 1
        const src = c.createBufferSource()
        src.buffer = buf
        const filt = c.createBiquadFilter()
        filt.type = 'highpass'
        filt.frequency.value = 8000
        const g = c.createGain()
        const t = startTime + i * (beat / 2) + beat * 0.25
        g.gain.setValueAtTime(i % 2 === 0 ? 0.08 : 0.04, t)
        g.gain.exponentialRampToValueAtTime(0.001, t + 0.04)
        src.connect(filt); filt.connect(g); g.connect(bgGain)
        src.start(t); src.stop(t + 0.05)
        bgNodes.push(src)
      }
    }

    function schedulePad(startTime) {
      // Dark minor chord pad
      const chords = [[110, 130.8, 164.8], [98, 123.5, 155.6]]
      chords.forEach((chord, ci) => {
        chord.forEach(freq => {
          const osc = c.createOscillator()
          const g = c.createGain()
          osc.connect(g); g.connect(bgGain)
          osc.type = 'triangle'
          osc.frequency.value = freq
          const t = startTime + ci * bar * 2
          g.gain.setValueAtTime(0, t)
          g.gain.linearRampToValueAtTime(0.04, t + 0.5)
          g.gain.linearRampToValueAtTime(0.04, t + bar * 2 - 0.3)
          g.gain.linearRampToValueAtTime(0, t + bar * 2)
          osc.start(t); osc.stop(t + bar * 2)
          bgNodes.push(osc)
        })
      })
    }

    // Schedule looping every 4 bars
    let loopStart = c.currentTime + 0.1
    function scheduleLoop() {
      scheduleBass(loopStart)
      scheduleHihat(loopStart)
      schedulePad(loopStart)
      loopStart += bar * 4
      setTimeout(scheduleLoop, bar * 4 * 1000 - 200)
    }
    scheduleLoop()
  } catch (e) {}
}

function stopBgMusic() {
  bgNodes.forEach(n => { try { n.stop() } catch (e) {} })
  bgNodes = []
  bgStarted = false
}

export const sfx = {
  unlock() {
    try { getCtx() } catch (e) {}
  },

  startBg() { startBgMusic() },
  stopBg()  { stopBgMusic() },

  setBgMuted(muted) {
    bgMuted = muted
    if (bgGain) {
      const c = getCtx()
      bgGain.gain.linearRampToValueAtTime(muted ? 0 : 0.12, c.currentTime + 0.3)
    }
  },

  isBgMuted() { return bgMuted },

  // ── COUNTDOWN ──
  countdownBeep(n) {
    if (n > 0) playTone({ freq: n === 1 ? 880 : 440, type: 'sine', duration: 0.12, gain: 0.4 })
  },

  // ── FIGHT ──
  fight() {
    playTone({ freq: 220, type: 'sawtooth', duration: 0.08, gain: 0.5 })
    playTone({ freq: 440, type: 'sawtooth', duration: 0.08, gain: 0.5, delay: 0.08 })
    playTone({ freq: 880, type: 'sawtooth', duration: 0.2,  gain: 0.6, delay: 0.16 })
  },

  // ── MESSAGE SENT ──
  messageSent() {
    playTone({ freq: 600, type: 'sine', duration: 0.08, gain: 0.15 })
    playTone({ freq: 900, type: 'sine', duration: 0.06, gain: 0.1, delay: 0.05 })
  },

  // ── HITS ──
  hitWeak() {
    playNoise({ duration: 0.08, gain: 0.15, filterFreq: 400 })
    playTone({ freq: 180, type: 'square', duration: 0.1, gain: 0.2 })
  },
  hitMedium() {
    playNoise({ duration: 0.12, gain: 0.25, filterFreq: 800 })
    playTone({ freq: 220, type: 'square', duration: 0.15, gain: 0.3 })
    playTone({ freq: 440, type: 'sine',   duration: 0.1,  gain: 0.2, delay: 0.05 })
  },
  hitHeavy() {
    playNoise({ duration: 0.18, gain: 0.4, filterFreq: 600 })
    playTone({ freq: 100, type: 'sawtooth', duration: 0.25, gain: 0.5 })
    playTone({ freq: 200, type: 'square',   duration: 0.2,  gain: 0.35, delay: 0.05 })
    playTone({ freq: 400, type: 'sine',     duration: 0.15, gain: 0.25, delay: 0.1 })
  },
  hitFatal() {
    playNoise({ duration: 0.25, gain: 0.5, filterFreq: 500 })
    playTone({ freq: 80,  type: 'sawtooth', duration: 0.3,  gain: 0.6 })
    playTone({ freq: 160, type: 'square',   duration: 0.25, gain: 0.45, delay: 0.05 })
    playTone({ freq: 320, type: 'sine',     duration: 0.2,  gain: 0.3,  delay: 0.1 })
    playTone({ freq: 640, type: 'sine',     duration: 0.15, gain: 0.2,  delay: 0.15 })
  },
  hitByScore(total) {
    if (total >= 25)      this.hitFatal()
    else if (total >= 20) this.hitHeavy()
    else if (total >= 13) this.hitMedium()
    else if (total > 3)   this.hitWeak()
    // score of 3 (spam/self) = silence — no reward sound
  },

  // ── ROUND END ──
  roundEnd() {
    playTone({ freq: 523, type: 'sine', duration: 0.8,  gain: 0.4 })
    playTone({ freq: 659, type: 'sine', duration: 0.6,  gain: 0.3, delay: 0.15 })
    playTone({ freq: 784, type: 'sine', duration: 0.5,  gain: 0.25, delay: 0.3 })
  },

  // ── WIN — triumphant ascending fanfare ──
  win() {
    const notes = [523, 659, 784, 1047, 1319]
    notes.forEach((f, i) => playTone({ freq: f, type: 'sine', duration: 0.3, gain: 0.45, delay: i * 0.1 }))
    // Extra punch
    setTimeout(() => {
      playNoise({ duration: 0.3, gain: 0.15, filterFreq: 2000 })
      playTone({ freq: 1047, type: 'square', duration: 0.4, gain: 0.3 })
    }, 600)
  },

  // ── LOSE — descending sad trombone style ──
  lose() {
    const notes = [330, 277, 220, 185, 147]
    notes.forEach((f, i) => playTone({ freq: f, type: 'sawtooth', duration: 0.35, gain: 0.35, delay: i * 0.12 }))
    // Low rumble underneath
    playTone({ freq: 60, type: 'sine', duration: 1.2, gain: 0.2, delay: 0.1 })
  },

  // ── TIMER ──
  tick() {
    playTone({ freq: 880, type: 'square', duration: 0.05, gain: 0.2 })
  },
  scoreUp() {
    playTone({ freq: 1200, type: 'sine', duration: 0.04, gain: 0.1 })
  },

  // ── CROWD ──
  crowdCheer() {
    playNoise({ duration: 0.4, gain: 0.12, filterFreq: 1200 })
    playNoise({ duration: 0.3, gain: 0.08, filterFreq: 2400 })
  },
  crowdBoo() {
    playNoise({ duration: 0.5, gain: 0.1, filterFreq: 300 })
    playTone({ freq: 150, type: 'sawtooth', duration: 0.4, gain: 0.15 })
  },

  // ── TYPING INDICATOR ──
  opponentTyping() {
    playTone({ freq: 300, type: 'sine', duration: 0.04, gain: 0.05 })
  },
}

export default sfx
