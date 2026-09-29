// SentinelAI Cybernetic Audio Synthesizer (Native Web Audio API)
// Provides immersive, subtle audio feedback for agent actions and telemetry states

let audioCtx = null;
let soundEnabled = false;

export const isAudioEnabled = () => soundEnabled;

export const toggleAudio = (forceState) => {
  if (forceState !== undefined) {
    soundEnabled = forceState;
  } else {
    soundEnabled = !soundEnabled;
  }
  
  if (soundEnabled && !audioCtx) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    } catch (e) {
      console.warn('Web Audio not available', e);
    }
  }

  if (soundEnabled && audioCtx && audioCtx.state === 'suspended') {
    audioCtx.resume();
  }

  // Play a gentle confirmation blip
  if (soundEnabled) {
    playBlip(680, 0.08, 'sine');
  }

  return soundEnabled;
};

const getContext = () => {
  if (!soundEnabled) return null;
  if (!audioCtx) {
    try {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) {
        audioCtx = new AudioContext();
      }
    } catch {
      return null;
    }
  }
  if (audioCtx.state === 'suspended') {
    audioCtx.resume();
  }
  return audioCtx;
};

// Subtle UI click / tab switch
export const playTabClick = () => {
  const ctx = getContext();
  if (!ctx) return;
  
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();
  
  osc.type = 'sine';
  osc.frequency.setValueAtTime(520, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(780, ctx.currentTime + 0.04);
  
  gain.gain.setValueAtTime(0.04, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.05);
  
  osc.connect(gain);
  gain.connect(ctx.destination);
  
  osc.start();
  osc.stop(ctx.currentTime + 0.05);
};

// Quick resonant blip
export const playBlip = (freq = 440, duration = 0.06, type = 'sine') => {
  const ctx = getContext();
  if (!ctx) return;

  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = type;
  osc.frequency.setValueAtTime(freq, ctx.currentTime);
  
  gain.gain.setValueAtTime(0.05, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + duration);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + duration);
};

// Warning / Anomaly Alert sound
export const playAnomalyAlarm = () => {
  const ctx = getContext();
  if (!ctx) return;

  // Dual tone pulse with lowpass filter
  const osc1 = ctx.createOscillator();
  const osc2 = ctx.createOscillator();
  const gain = ctx.createGain();

  osc1.type = 'sawtooth';
  osc2.type = 'triangle';

  osc1.frequency.setValueAtTime(420, ctx.currentTime);
  osc1.frequency.linearRampToValueAtTime(320, ctx.currentTime + 0.25);
  
  osc2.frequency.setValueAtTime(210, ctx.currentTime);
  osc2.frequency.linearRampToValueAtTime(160, ctx.currentTime + 0.25);

  gain.gain.setValueAtTime(0.08, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.28);

  const filter = ctx.createBiquadFilter();
  filter.type = 'lowpass';
  filter.frequency.setValueAtTime(900, ctx.currentTime);

  osc1.connect(filter);
  osc2.connect(filter);
  filter.connect(gain);
  gain.connect(ctx.destination);

  osc1.start();
  osc2.start();
  osc1.stop(ctx.currentTime + 0.28);
  osc2.stop(ctx.currentTime + 0.28);
};

// Step execution chirp
export const playStepChirp = (stepIndex = 1) => {
  const ctx = getContext();
  if (!ctx) return;

  const baseFreq = 480 + (stepIndex * 120);
  const osc = ctx.createOscillator();
  const gain = ctx.createGain();

  osc.type = 'sine';
  osc.frequency.setValueAtTime(baseFreq, ctx.currentTime);
  osc.frequency.exponentialRampToValueAtTime(baseFreq * 1.5, ctx.currentTime + 0.08);

  gain.gain.setValueAtTime(0.05, ctx.currentTime);
  gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.09);

  osc.connect(gain);
  gain.connect(ctx.destination);

  osc.start();
  osc.stop(ctx.currentTime + 0.09);
};

// Success harmonic chime
export const playSuccessChime = () => {
  const ctx = getContext();
  if (!ctx) return;

  const notes = [523.25, 659.25, 783.99, 1046.50]; // C5, E5, G5, C6
  notes.forEach((freq, idx) => {
    const osc = ctx.createOscillator();
    const gain = ctx.createGain();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(freq, ctx.currentTime + (idx * 0.08));

    gain.gain.setValueAtTime(0.06, ctx.currentTime + (idx * 0.08));
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + (idx * 0.08) + 0.45);

    osc.connect(gain);
    gain.connect(ctx.destination);

    osc.start(ctx.currentTime + (idx * 0.08));
    osc.stop(ctx.currentTime + (idx * 0.08) + 0.45);
  });
};
