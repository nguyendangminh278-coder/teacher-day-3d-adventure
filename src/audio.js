// Original generative pentatonic score. No autoplay, network files or licensed recording.
export class Soundscape {
  constructor() {
    this.context = null;
    this.enabled = false;
    this.lastBeat = -1;
  }
  async toggle() {
    if (!this.context) {
      const Context = window.AudioContext || window.webkitAudioContext;
      if (!Context) return false;
      this.context = new Context();
      this.master = this.context.createGain();
      this.master.gain.value = 0.16;
      this.master.connect(this.context.destination);
    }
    this.enabled = !this.enabled;
    if (this.enabled) await this.context.resume();
    else await this.context.suspend();
    return this.enabled;
  }
  note(frequency, at, duration = 2.6) {
    const ctx = this.context,
      osc = ctx.createOscillator(),
      gain = ctx.createGain();
    osc.type = "sine";
    osc.frequency.value = frequency;
    gain.gain.setValueAtTime(0, at);
    gain.gain.linearRampToValueAtTime(0.22, at + 0.035);
    gain.gain.exponentialRampToValueAtTime(0.0001, at + duration);
    osc.connect(gain);
    gain.connect(this.master);
    osc.start(at);
    osc.stop(at + duration + 0.05);
    osc.onended = () => {
      osc.disconnect();
      gain.disconnect();
    };
  }
  update(t, paused) {
    if (!this.enabled || this.context?.state !== "running" || paused) return;
    const beat = Math.floor(t / 1.4);
    if (beat === this.lastBeat) return;
    this.lastBeat = beat;
    const notes = [261.63, 329.63, 392, 440, 523.25, 440, 392, 329.63];
    this.note(notes[beat % notes.length], this.context.currentTime);
    if (beat % 4 === 0) this.note(130.81, this.context.currentTime, 4.8);
  }
  async pause(v) {
    if (!this.context || !this.enabled) return;
    if (v) await this.context.suspend();
    else await this.context.resume();
  }
}
