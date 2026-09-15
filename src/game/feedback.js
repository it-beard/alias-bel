/** Кароткія гукавыя сігналы праз Web Audio — без знешніх файлаў. */
let ctx = null

function audioContext() {
  if (typeof window === 'undefined') return null
  const Ctor = window.AudioContext || window.webkitAudioContext
  if (!Ctor) return null
  if (!ctx) ctx = new Ctor()
  if (ctx.state === 'suspended') ctx.resume()
  return ctx
}

/** Разблакіроўка аўдыя — выклікаецца ў адказ на дотык карыстальніка. */
export function unlockAudio() {
  audioContext()
}

function tone({ freq, duration = 0.12, type = 'sine', gain = 0.08, delay = 0 }) {
  const ac = audioContext()
  if (!ac) return
  const osc = ac.createOscillator()
  const amp = ac.createGain()
  const start = ac.currentTime + delay
  osc.type = type
  osc.frequency.setValueAtTime(freq, start)
  amp.gain.setValueAtTime(0, start)
  amp.gain.linearRampToValueAtTime(gain, start + 0.01)
  amp.gain.exponentialRampToValueAtTime(0.0001, start + duration)
  osc.connect(amp).connect(ac.destination)
  osc.start(start)
  osc.stop(start + duration + 0.02)
}

export const sounds = {
  correct: () => tone({ freq: 880, duration: 0.12, type: 'triangle' }),
  skip: () => tone({ freq: 220, duration: 0.16, type: 'sawtooth', gain: 0.05 }),
  tick: () => tone({ freq: 1200, duration: 0.05, type: 'square', gain: 0.03 }),
  start: () => {
    tone({ freq: 660, duration: 0.1, type: 'triangle', gain: 0.07 })
    tone({ freq: 990, duration: 0.18, type: 'triangle', gain: 0.07, delay: 0.1 })
  },
  timeUp: () => {
    tone({ freq: 440, duration: 0.2, type: 'square', gain: 0.07 })
    tone({ freq: 330, duration: 0.35, type: 'square', gain: 0.07, delay: 0.2 })
  },
  win: () => {
    ;[523, 659, 784, 1046].forEach((f, i) =>
      tone({ freq: f, duration: 0.22, type: 'triangle', gain: 0.07, delay: i * 0.12 }),
    )
  },
}

export function vibrate(pattern) {
  if (typeof navigator !== 'undefined' && navigator.vibrate) navigator.vibrate(pattern)
}
