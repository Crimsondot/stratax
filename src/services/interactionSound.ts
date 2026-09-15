/** Rich, asset-free UI sound system for Mineral Sentinel dashboard. */

type SoundProfile = 'nav' | 'primary' | 'danger' | 'warning' | 'default' | 'alert-ack' | 'seal'
  | 'modal-open' | 'modal-close' | 'alert-new' | 'save-success' | 'tab-switch' | 'gauge-fill' | 'drill-stage';

function getProfile(el: Element): SoundProfile {
  if (el.classList.contains('sidebar-rail-item'))   return 'nav';
  if (el.classList.contains('btn-danger'))          return 'danger';
  if (el.classList.contains('btn-warning'))         return 'warning';
  if (el.classList.contains('btn-primary'))         return 'primary';
  if (el.classList.contains('cc-alert-ack-btn'))    return 'alert-ack';
  if (el.classList.contains('institutional-seal'))  return 'seal';
  return 'default';
}

function playTone(
  ctx: AudioContext,
  type: OscillatorType,
  freq: number,
  freqEnd: number,
  vol: number,
  attack: number,
  decay: number,
  delay = 0
) {
  const osc  = ctx.createOscillator();
  const gain = ctx.createGain();
  const t    = ctx.currentTime + delay;
  osc.type = type;
  osc.frequency.setValueAtTime(freq, t);
  if (freqEnd !== freq) osc.frequency.exponentialRampToValueAtTime(freqEnd, t + decay);
  gain.gain.setValueAtTime(0.0001, t);
  gain.gain.exponentialRampToValueAtTime(vol, t + attack);
  gain.gain.exponentialRampToValueAtTime(0.0001, t + decay);
  osc.connect(gain).connect(ctx.destination);
  osc.start(t);
  osc.stop(t + decay + 0.01);
}

function playSound(ctx: AudioContext, profile: SoundProfile) {
  switch (profile) {
    case 'nav':
      // Smooth rising two-tone — soft & musical
      playTone(ctx, 'sine',     440, 560, 0.022, 0.010, 0.12);
      playTone(ctx, 'sine',     660, 660, 0.012, 0.015, 0.10, 0.06);
      break;

    case 'primary':
      // Crisp mid-range click with slight shimmer
      playTone(ctx, 'sine',     520, 640, 0.025, 0.008, 0.09);
      playTone(ctx, 'triangle', 780, 780, 0.010, 0.005, 0.06, 0.03);
      break;

    case 'danger':
      // Descending minor-third warning
      playTone(ctx, 'sawtooth', 320, 200, 0.018, 0.010, 0.16);
      playTone(ctx, 'sine',     200, 140, 0.010, 0.020, 0.12, 0.09);
      break;

    case 'warning':
      // Double mid-tone nudge
      playTone(ctx, 'sine',     400, 350, 0.020, 0.010, 0.10);
      playTone(ctx, 'sine',     500, 450, 0.012, 0.010, 0.09, 0.08);
      break;

    case 'alert-ack':
      // Rising confirmation chord
      playTone(ctx, 'sine',     440, 660, 0.020, 0.008, 0.14);
      playTone(ctx, 'sine',     550, 880, 0.012, 0.010, 0.12, 0.05);
      playTone(ctx, 'sine',     880, 880, 0.008, 0.015, 0.10, 0.12);
      break;

    case 'seal':
      // Ceremonial shimmer — rich ascending triad with reverb tail
      playTone(ctx, 'sine',     330, 440, 0.018, 0.005, 0.18);
      playTone(ctx, 'sine',     440, 660, 0.014, 0.010, 0.16, 0.06);
      playTone(ctx, 'triangle', 660, 880, 0.010, 0.012, 0.14, 0.12);
      playTone(ctx, 'sine',     880, 1100, 0.006, 0.015, 0.20, 0.18);
      break;

    case 'modal-open':
      // Soft ascending chime — two sine tones rising
      playTone(ctx, 'sine', 520, 660, 0.015, 0.008, 0.12);
      playTone(ctx, 'sine', 660, 880, 0.010, 0.010, 0.10, 0.06);
      break;

    case 'modal-close':
      // Soft descending chime — mirror of modal-open
      playTone(ctx, 'sine', 880, 660, 0.012, 0.008, 0.10);
      playTone(ctx, 'sine', 660, 520, 0.010, 0.010, 0.08, 0.05);
      break;

    case 'alert-new':
      // Attention-grabbing double-tap — quick mid-range bursts
      playTone(ctx, 'triangle', 600, 600, 0.020, 0.004, 0.06);
      playTone(ctx, 'triangle', 700, 700, 0.018, 0.004, 0.06, 0.08);
      break;

    case 'save-success':
      // Confirmation chord — rising triad
      playTone(ctx, 'sine', 440, 550, 0.015, 0.006, 0.14);
      playTone(ctx, 'sine', 550, 660, 0.012, 0.008, 0.12, 0.06);
      playTone(ctx, 'sine', 660, 880, 0.008, 0.010, 0.10, 0.12);
      break;

    case 'tab-switch':
      // Subtle whoosh — filtered noise-like sweep
      playTone(ctx, 'sine', 300, 600, 0.008, 0.005, 0.08);
      playTone(ctx, 'sine', 400, 200, 0.005, 0.010, 0.06, 0.03);
      break;

    case 'gauge-fill':
      // Rising tone — pitch follows gauge progress
      playTone(ctx, 'sine', 220, 440, 0.010, 0.015, 0.20);
      break;

    case 'drill-stage':
      // Escalation tone — ascending minor third
      playTone(ctx, 'triangle', 330, 440, 0.018, 0.008, 0.15);
      playTone(ctx, 'sine', 440, 550, 0.012, 0.010, 0.12, 0.08);
      playTone(ctx, 'sine', 550, 660, 0.008, 0.012, 0.10, 0.16);
      break;

    default:
      // Light tap — almost imperceptible click
      playTone(ctx, 'sine',     380, 300, 0.015, 0.006, 0.065);
      break;
  }
}

export function playSealHoverSound(): void {
  try {
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    // Soft ethereal shimmer on hover
    playTone(ctx, 'sine',     523, 659, 0.008, 0.010, 0.22);
    playTone(ctx, 'sine',     659, 784, 0.005, 0.015, 0.18, 0.08);
    playTone(ctx, 'triangle', 784, 1047, 0.003, 0.020, 0.15, 0.15);
  } catch { /* audio is progressive enhancement */ }
}

export function playSoundEffect(profile: SoundProfile): void {
  try {
    const ctx = new AudioContext();
    if (ctx.state === 'suspended') ctx.resume();
    playSound(ctx, profile);
  } catch { /* progressive enhancement */ }
}

export function enableInteractionSounds(): () => void {
  let context: AudioContext | undefined;

  const play = (event: Event) => {
    if (!(event.target instanceof Element)) return;
    const action = event.target.closest('button:not(:disabled), a[href], [role="button"]');
    if (!action || action.getAttribute('aria-disabled') === 'true') return;

    try {
      context ??= new AudioContext();
      if (context.state === 'suspended') context.resume();
      playSound(context, getProfile(action));
    } catch {
      // Audio is progressive enhancement; the interface works without it.
    }
  };

  document.addEventListener('click', play, { capture: true });
  return () => document.removeEventListener('click', play, { capture: true });
}

