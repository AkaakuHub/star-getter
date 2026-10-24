import type { Note } from './composition';

export function scheduleNote(
  context: AudioContext,
  output: GainNode,
  note: Note,
  time: number,
  secondsPerBeat: number,
): void {
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  const frequency = 440 * 2 ** ((note.midi - 69) / 12);
  const duration = Math.max(0.03, note.length * secondsPerBeat);
  oscillator.type = note.voice === 'lead' ? 'triangle' : 'sine';
  oscillator.frequency.setValueAtTime(frequency, time);
  if (note.voice === 'kick') {
    oscillator.frequency.setValueAtTime(145, time);
    oscillator.frequency.exponentialRampToValueAtTime(42, time + duration);
  }
  const volume = { lead: 0.2, chord: 0.045, bass: 0.18, kick: 0.3, hat: 0.015 }[note.voice];
  envelope.gain.setValueAtTime(0, time);
  envelope.gain.linearRampToValueAtTime(volume, time + 0.008);
  envelope.gain.exponentialRampToValueAtTime(0.0001, time + duration);
  oscillator.connect(envelope);
  envelope.connect(output);
  oscillator.start(time);
  oscillator.stop(time + duration + 0.01);
  oscillator.onended = () => {
    oscillator.disconnect();
    envelope.disconnect();
  };
}
