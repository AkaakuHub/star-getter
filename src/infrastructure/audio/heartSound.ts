import type { GameSound } from '../../app/gameAudio';

const tones: Readonly<
  Record<
    GameSound,
    Readonly<{
      waveform: OscillatorType;
      from: number;
      to: number;
      duration: number;
      volume: number;
    }>
  >
> = {
  'heart-spawn': { waveform: 'sine', from: 740, to: 1046, duration: 0.07, volume: 0.04 },
  'heart-collect': { waveform: 'triangle', from: 1174, to: 1760, duration: 0.1, volume: 0.06 },
};

export function playHeartSound(
  context: BaseAudioContext,
  output: AudioNode,
  sound: GameSound,
): void {
  const tone = tones[sound];
  const now = context.currentTime;
  const oscillator = context.createOscillator();
  const envelope = context.createGain();
  oscillator.type = tone.waveform;
  oscillator.frequency.setValueAtTime(tone.from, now);
  oscillator.frequency.exponentialRampToValueAtTime(tone.to, now + tone.duration);
  envelope.gain.setValueAtTime(0, now);
  envelope.gain.linearRampToValueAtTime(tone.volume, now + 0.004);
  envelope.gain.exponentialRampToValueAtTime(0.0001, now + tone.duration);
  oscillator.connect(envelope);
  envelope.connect(output);
  oscillator.onended = () => {
    oscillator.disconnect();
    envelope.disconnect();
  };
  oscillator.start(now);
  oscillator.stop(now + tone.duration);
}
