/**
 * Lightweight UI sound effects, synthesized with the Web Audio API instead
 * of shipping audio files. Everything here is pure oscillator tones, so
 * there's nothing to license, host, or download — it works offline and
 * costs near-zero bytes.
 */

let sharedContext: AudioContext | null = null;

function getContext(): AudioContext | null {
  if (typeof window === "undefined") return null;
  const AudioContextClass =
    window.AudioContext || (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
  if (!AudioContextClass) return null;

  if (!sharedContext || sharedContext.state === "closed") {
    sharedContext = new AudioContextClass();
  }
  if (sharedContext.state === "suspended") {
    sharedContext.resume().catch(() => {});
  }
  return sharedContext;
}

interface Tone {
  frequency: number;
  duration: number;
  type?: OscillatorType;
  delay?: number;
  gain?: number;
}

/** Plays one or more short tones back to back (a tiny "melody"). */
function playTones(tones: Tone[]) {
  const ctx = getContext();
  if (!ctx) return;

  const now = ctx.currentTime;

  for (const tone of tones) {
    const oscillator = ctx.createOscillator();
    const gainNode = ctx.createGain();
    const start = now + (tone.delay ?? 0);
    const peakGain = tone.gain ?? 0.15;

    oscillator.type = tone.type ?? "sine";
    oscillator.frequency.setValueAtTime(tone.frequency, start);

    gainNode.gain.setValueAtTime(0, start);
    gainNode.gain.linearRampToValueAtTime(peakGain, start + 0.01);
    gainNode.gain.exponentialRampToValueAtTime(0.001, start + tone.duration);

    oscillator.connect(gainNode);
    gainNode.connect(ctx.destination);

    oscillator.start(start);
    oscillator.stop(start + tone.duration + 0.02);
  }
}

/** Short blip when you send a message. */
export function playSendSound() {
  playTones([{ frequency: 720, duration: 0.08, type: "sine", gain: 0.12 }]);
}

/** Soft two-note ping for an incoming message in the conversation you have open. */
export function playReceiveSound() {
  playTones([
    { frequency: 500, duration: 0.09, type: "sine", gain: 0.12 },
    { frequency: 660, duration: 0.12, delay: 0.07, type: "sine", gain: 0.12 },
  ]);
}

/** Slightly more attention-grabbing ping for a message in a chat you don't have open. */
export function playNotificationSound() {
  playTones([
    { frequency: 880, duration: 0.1, type: "triangle", gain: 0.13 },
    { frequency: 1108, duration: 0.14, delay: 0.09, type: "triangle", gain: 0.13 },
  ]);
}

/** Little upward fanfare for "It's a match!" */
export function playMatchSound() {
  playTones([
    { frequency: 523.25, duration: 0.12, delay: 0, type: "triangle", gain: 0.14 },
    { frequency: 659.25, duration: 0.12, delay: 0.1, type: "triangle", gain: 0.14 },
    { frequency: 783.99, duration: 0.2, delay: 0.2, type: "triangle", gain: 0.16 },
  ]);
}

export interface RingtoneDefinition {
  id: string;
  label: string;
  /** One cycle of the ringtone pattern, in seconds — determines the loop gap. */
  pattern: Tone[];
  cycleSeconds: number;
}

export const RINGTONES: RingtoneDefinition[] = [
  {
    id: "classic-chime",
    label: "Classic Chime",
    pattern: [
      { frequency: 784, duration: 0.25, type: "sine", gain: 0.18 },
      { frequency: 988, duration: 0.35, delay: 0.28, type: "sine", gain: 0.18 },
    ],
    cycleSeconds: 1.4,
  },
  {
    id: "soft-bell",
    label: "Soft Bell",
    pattern: [
      { frequency: 660, duration: 0.4, type: "triangle", gain: 0.16 },
      { frequency: 660, duration: 0.4, delay: 0.5, type: "triangle", gain: 0.12 },
    ],
    cycleSeconds: 1.6,
  },
  {
    id: "digital-pulse",
    label: "Digital Pulse",
    pattern: [
      { frequency: 440, duration: 0.12, type: "square", gain: 0.1 },
      { frequency: 440, duration: 0.12, delay: 0.18, type: "square", gain: 0.1 },
      { frequency: 440, duration: 0.12, delay: 0.36, type: "square", gain: 0.1 },
    ],
    cycleSeconds: 1.2,
  },
  {
    id: "marimba",
    label: "Marimba",
    pattern: [
      { frequency: 523.25, duration: 0.18, type: "triangle", gain: 0.16 },
      { frequency: 659.25, duration: 0.18, delay: 0.16, type: "triangle", gain: 0.16 },
      { frequency: 783.99, duration: 0.28, delay: 0.32, type: "triangle", gain: 0.16 },
    ],
    cycleSeconds: 1.5,
  },
];

export const DEFAULT_RINGTONE_ID = RINGTONES[0].id;

export function getRingtone(id: string): RingtoneDefinition {
  return RINGTONES.find((ringtone) => ringtone.id === id) ?? RINGTONES[0];
}

/** Plays one loop of a ringtone pattern immediately (for previewing). */
export function previewRingtone(id: string) {
  playTones(getRingtone(id).pattern);
}

let ringtoneIntervalId: ReturnType<typeof setInterval> | null = null;

/** Starts looping a ringtone pattern until `stopRingtone()` is called. */
export function startRingtone(id: string) {
  stopRingtone();
  const ringtone = getRingtone(id);

  playTones(ringtone.pattern);
  ringtoneIntervalId = setInterval(() => {
    playTones(ringtone.pattern);
  }, ringtone.cycleSeconds * 1000);
}

export function stopRingtone() {
  if (ringtoneIntervalId !== null) {
    clearInterval(ringtoneIntervalId);
    ringtoneIntervalId = null;
  }
}