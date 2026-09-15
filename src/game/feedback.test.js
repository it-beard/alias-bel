import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'

function fakeAudio() {
  const oscillators = []
  class Gain {
    constructor() {
      this.gain = {
        setValueAtTime: vi.fn(),
        linearRampToValueAtTime: vi.fn(),
        exponentialRampToValueAtTime: vi.fn(),
      }
    }
    connect(node) {
      return node
    }
  }
  class Oscillator {
    constructor() {
      this.type = 'sine'
      this.frequency = { setValueAtTime: vi.fn() }
      this.start = vi.fn()
      this.stop = vi.fn()
      oscillators.push(this)
    }
    connect(node) {
      return node
    }
  }
  class AudioContext {
    constructor() {
      this.state = 'suspended'
      this.currentTime = 0
      this.destination = {}
      this.resume = vi.fn(() => {
        this.state = 'running'
      })
      AudioContext.instances.push(this)
    }
    createOscillator() {
      return new Oscillator()
    }
    createGain() {
      return new Gain()
    }
  }
  AudioContext.instances = []
  return { AudioContext, oscillators }
}

describe('feedback (гук і вібрацыя)', () => {
  let fake
  let mod

  beforeEach(async () => {
    vi.resetModules()
    fake = fakeAudio()
    vi.stubGlobal('AudioContext', fake.AudioContext)
    mod = await import('./feedback.js')
  })

  afterEach(() => {
    vi.unstubAllGlobals()
  })

  it('unlockAudio стварае адзін кантэкст і абуджае яго', () => {
    mod.unlockAudio()
    mod.unlockAudio()
    expect(fake.AudioContext.instances).toHaveLength(1)
    expect(fake.AudioContext.instances[0].resume).toHaveBeenCalled()
  })

  it('кожны сігнал запускае асцылятары', () => {
    mod.sounds.correct()
    expect(fake.oscillators).toHaveLength(1)
    expect(fake.oscillators[0].start).toHaveBeenCalledTimes(1)
    expect(fake.oscillators[0].frequency.setValueAtTime).toHaveBeenCalledWith(880, expect.any(Number))
    mod.sounds.skip()
    mod.sounds.tick()
    mod.sounds.start()
    mod.sounds.timeUp()
    mod.sounds.win()
    // 1 + 1 + 1 + 2 + 2 + 4
    expect(fake.oscillators).toHaveLength(11)
    for (const osc of fake.oscillators) expect(osc.stop).toHaveBeenCalled()
  })

  it('без Web Audio нічога не падае', async () => {
    vi.resetModules()
    vi.stubGlobal('AudioContext', undefined)
    vi.stubGlobal('webkitAudioContext', undefined)
    const silent = await import('./feedback.js')
    expect(() => silent.unlockAudio()).not.toThrow()
    expect(() => silent.sounds.win()).not.toThrow()
  })

  it('vibrate выклікае navigator.vibrate, калі ён ёсць', () => {
    const vibrateFn = vi.fn()
    vi.stubGlobal('navigator', { ...navigator, vibrate: vibrateFn })
    mod.vibrate([10, 20])
    expect(vibrateFn).toHaveBeenCalledWith([10, 20])
  })

  it('vibrate без падтрымкі не падае', () => {
    vi.stubGlobal('navigator', { userAgent: 'test' })
    expect(() => mod.vibrate(10)).not.toThrow()
  })

  it('адмова браўзера ў аўдыя і вібрацыі не перарывае гульню', () => {
    vi.stubGlobal('AudioContext', class { constructor() { throw new Error('denied') } })
    vi.stubGlobal('navigator', { vibrate() { throw new Error('denied') } })
    expect(() => mod.unlockAudio()).not.toThrow()
    expect(() => mod.sounds.correct()).not.toThrow()
    expect(() => mod.vibrate(10)).not.toThrow()
  })
})
