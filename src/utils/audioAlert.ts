/**
 * Audio Alert Utility for Admin Chat Notifications
 * Plays a clear, loud, dual-tone notification beep/chime across all devices:
 * Android phones, iPhones (iOS Safari), iPads, Tablets, Laptops, and Desktop PCs.
 */

let audioCtx: AudioContext | null = null;
let lastBeepTime = 0;

// Generate fallback WAV audio data URI (sine wave chime) for bulletproof redundancy
const FALLBACK_BEEP_DATA_URI =
  'data:audio/wav;base64,UklGRl9vT19XQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YU' +
  'FvT18A////AAAAAP///wAAAAAA////AAAAAP///wAAAAAA////AAAAAP///wAAAAAA////AAAAAP///wAAAA' +
  'AA////AAAAAP///wAAAAAA////AAAAAP///wAAAAAA////AAAAAP///wAAAAAA////AAAAAP///wAAAAAA//' +
  '/8AAAAAP///wAAAAAA////AAAAAP///wAAAAAA////AAAAAP///wAAAAAA////AAAAAP///wAAAAAA////AA' +
  'AAAP///wAAAAAA////AAAAAP///wAAAAAA////AAAAAP///wAAAAAA////AAAAAP///wAAAAAA////AAAAAP';

/**
 * Returns or initializes the shared AudioContext
 */
export function getAudioContext(): AudioContext | null {
  if (typeof window === 'undefined') return null;
  try {
    if (!audioCtx) {
      const AudioContextClass =
        window.AudioContext ||
        (window as unknown as { webkitAudioContext?: typeof AudioContext }).webkitAudioContext;
      if (AudioContextClass) {
        audioCtx = new AudioContextClass();
      }
    }
    if (audioCtx && audioCtx.state === 'suspended') {
      audioCtx.resume().catch(() => {});
    }
  } catch (err) {
    console.warn('AudioContext initialization note:', err);
  }
  return audioCtx;
}

/**
 * Automatically unlocks Web Audio on mobile devices (iOS Safari & Android Chrome)
 * on the first touch, tap, click, or keydown event.
 */
export function initAudioUnlockListener(): () => void {
  if (typeof window === 'undefined') return () => {};

  const unlock = () => {
    try {
      const ctx = getAudioContext();
      if (ctx) {
        if (ctx.state === 'suspended') {
          ctx.resume().catch(() => {});
        }
        // Play an ultra-short silent buffer to unlock the audio hardware on iOS
        const buffer = ctx.createBuffer(1, 1, 22050);
        const source = ctx.createBufferSource();
        source.buffer = buffer;
        source.connect(ctx.destination);
        source.start(0);
      }
    } catch (e) {
      console.warn('Audio unlock catch:', e);
    }

    // Clean up event listeners once unlocked
    ['touchstart', 'touchend', 'click', 'pointerdown', 'keydown'].forEach((ev) => {
      window.removeEventListener(ev, unlock, true);
      document.removeEventListener(ev, unlock, true);
    });
  };

  ['touchstart', 'touchend', 'click', 'pointerdown', 'keydown'].forEach((ev) => {
    window.addEventListener(ev, unlock, { once: true, capture: true, passive: true });
    document.addEventListener(ev, unlock, { once: true, capture: true, passive: true });
  });

  return () => {
    ['touchstart', 'touchend', 'click', 'pointerdown', 'keydown'].forEach((ev) => {
      window.removeEventListener(ev, unlock, true);
      document.removeEventListener(ev, unlock, true);
    });
  };
}

// Auto-run unlock listener on load
if (typeof window !== 'undefined') {
  initAudioUnlockListener();
}

/**
 * Checks if sound notification is enabled in admin settings
 */
export function isSoundEnabled(): boolean {
  if (typeof window === 'undefined') return true;
  const val = localStorage.getItem('nexus_admin_chat_sound');
  return val === null ? true : val === 'true';
}

/**
 * Toggles or updates the sound setting
 */
export function setSoundEnabled(enabled: boolean): void {
  if (typeof window === 'undefined') return;
  localStorage.setItem('nexus_admin_chat_sound', String(enabled));
}

/**
 * Plays the incoming chat message or order notification alert.
 * Synthesizes an audible, luxurious ~4-second melodic chime/ringtone sound sequence
 * (D5 -> F#5 -> A5 -> D6 -> F#6 -> A6 -> D7 grand resolving bell chord).
 * Sounds like an elegant acoustic retail bell / smartphone order chime.
 * Highly audible on mobile phone speakers, laptops, tablets, and desktop displays.
 * Includes a 3800ms throttle so the 4-second alert plays uninterrupted.
 */
export function playNotificationBeep(force = false): void {
  if (!isSoundEnabled() && !force) return;

  const now = Date.now();
  if (!force && now - lastBeepTime < 3800) {
    return; // Prevent duplicate overlapping alert sequences during 4-second playback
  }
  lastBeepTime = now;

  // 1. Mobile Phone Haptic Vibration (Rhythmic alerts across 4 seconds)
  if (typeof navigator !== 'undefined' && 'vibrate' in navigator) {
    try {
      navigator.vibrate([250, 150, 250, 150, 350, 200, 450, 200, 800]);
    } catch {}
  }

  // 2. Synthesize Rich 4-Second Melodic Chime Sound via Web Audio API
  try {
    const ctx = getAudioContext();
    if (ctx) {
      if (ctx.state === 'suspended') {
        ctx.resume().catch(() => {});
      }

      const audioNow = ctx.currentTime;

      // Master Gain
      const masterGain = ctx.createGain();
      masterGain.gain.setValueAtTime(0.95, audioNow);
      masterGain.connect(ctx.destination);

      // Elegant 4-Second Melodic Chime Composition:
      // Phrase 1 (0.0s - 1.1s): Warm ascending marimba chime
      // Phrase 2 (1.1s - 2.6s): High sparkling retail chime lift
      // Phrase 3 (2.6s - 4.2s): Resonant crystal bell chord with long acoustic decay
      const chimes = [
        // Note 1: D5 (587.33 Hz)
        { freq: 587.33, start: 0.00, dur: 0.65, peakGain: 0.70, type: 'sine' as OscillatorType },
        // Note 2: F#5 (739.99 Hz)
        { freq: 739.99, start: 0.35, dur: 0.65, peakGain: 0.75, type: 'sine' as OscillatorType },
        // Note 3: A5 (880.00 Hz)
        { freq: 880.00, start: 0.72, dur: 0.70, peakGain: 0.80, type: 'sine' as OscillatorType },
        // Note 4: D6 (1174.66 Hz)
        { freq: 1174.66, start: 1.15, dur: 0.75, peakGain: 0.85, type: 'sine' as OscillatorType },
        // Note 5: F#6 (1479.98 Hz)
        { freq: 1479.98, start: 1.62, dur: 0.75, peakGain: 0.85, type: 'sine' as OscillatorType },
        // Note 6: A6 (1760.00 Hz)
        { freq: 1760.00, start: 2.10, dur: 0.85, peakGain: 0.90, type: 'sine' as OscillatorType },
        // Note 7: Grand Resolving Bell Chord (2.65s to 4.20s - full 4 second finish)
        { freq: 1174.66, start: 2.65, dur: 1.55, peakGain: 0.75, type: 'sine' as OscillatorType },
        { freq: 1760.00, start: 2.65, dur: 1.55, peakGain: 0.70, type: 'sine' as OscillatorType },
        { freq: 2349.32, start: 2.65, dur: 1.55, peakGain: 0.55, type: 'triangle' as OscillatorType },
      ];

      chimes.forEach(({ freq, start, dur, peakGain, type }) => {
        const osc = ctx.createOscillator();
        const gain = ctx.createGain();
        osc.type = type || 'sine';
        osc.frequency.setValueAtTime(freq, audioNow + start);

        const startTime = audioNow + start;
        const endTime = startTime + dur;

        // Smooth acoustic envelope (quick gentle attack, musical decay)
        gain.gain.setValueAtTime(0.0001, startTime);
        gain.gain.exponentialRampToValueAtTime(peakGain, startTime + 0.035);
        gain.gain.exponentialRampToValueAtTime(0.0001, endTime);

        osc.connect(gain);
        gain.connect(masterGain);

        osc.start(startTime);
        osc.stop(endTime + 0.05);
      });

      return;
    }
  } catch (err) {
    console.warn('Web Audio synthesis error, attempting HTML5 audio fallback:', err);
  }

  // 3. Fallback to HTML5 Audio Element if AudioContext is unsupported
  try {
    const audio = new Audio(FALLBACK_BEEP_DATA_URI);
    audio.volume = 0.95;
    const playPromise = audio.play();
    if (playPromise !== undefined) {
      playPromise.catch(() => {});
    }
  } catch {}
}

/**
 * Manually tests the notification beep (unlocks audio context and plays immediately)
 */
export function testNotificationBeep(): void {
  playNotificationBeep(true);
}
