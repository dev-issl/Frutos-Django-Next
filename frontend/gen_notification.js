/**
 * Generates a real notification sound WAV file.
 * Mimics WhatsApp/Telegram double-chime: two ascending sine tones
 * with fast attack + exponential decay — sounds like a real notification.
 */
const fs = require('fs');
const path = require('path');

const SAMPLE_RATE = 44100;
const CHANNELS = 1;
const BIT_DEPTH = 16;
const DURATION = 0.55; // seconds
const NUM_SAMPLES = Math.floor(SAMPLE_RATE * DURATION);

// Build PCM samples
const samples = new Float32Array(NUM_SAMPLES);

// Helper: add a sine tone with envelope into samples array
function addTone(freq, startSec, durationSec, peakAmp, attackSec = 0.005, decaySec = null) {
  if (decaySec === null) decaySec = durationSec - attackSec;
  const start = Math.floor(startSec * SAMPLE_RATE);
  const len   = Math.floor(durationSec * SAMPLE_RATE);
  const attackSamples = Math.floor(attackSec * SAMPLE_RATE);
  const decaySamples  = Math.floor(decaySec  * SAMPLE_RATE);

  for (let i = 0; i < len; i++) {
    const si = start + i;
    if (si >= NUM_SAMPLES) break;

    // Envelope
    let env;
    if (i < attackSamples) {
      env = i / attackSamples; // linear ramp up
    } else {
      const decayProgress = (i - attackSamples) / decaySamples;
      env = Math.exp(-5 * decayProgress); // exponential decay
    }

    // Sine wave
    const phase = (2 * Math.PI * freq * si) / SAMPLE_RATE;
    samples[si] += peakAmp * env * Math.sin(phase);
  }
}

// --- WhatsApp / Telegram-style double chime ---
// First note: 880 Hz (A5)  — bright, clean
addTone(880,    0.00, 0.22, 0.70, 0.004, 0.22);
// Second note: 1108 Hz (C#6) — slightly higher, slightly later
addTone(1108.7, 0.13, 0.28, 0.55, 0.004, 0.28);
// Subtle harmonic body on first note (half-volume at 1760 Hz)
addTone(1760,   0.00, 0.12, 0.18, 0.003, 0.12);

// Clamp to [-1, 1]
for (let i = 0; i < NUM_SAMPLES; i++) {
  samples[i] = Math.max(-1, Math.min(1, samples[i]));
}

// --- Build WAV buffer ---
const dataSize   = NUM_SAMPLES * CHANNELS * (BIT_DEPTH / 8);
const headerSize = 44;
const buf = Buffer.alloc(headerSize + dataSize);

// RIFF header
buf.write('RIFF', 0);
buf.writeUInt32LE(36 + dataSize, 4);
buf.write('WAVE', 8);
// fmt chunk
buf.write('fmt ', 12);
buf.writeUInt32LE(16, 16);             // chunk size
buf.writeUInt16LE(1,  20);             // PCM
buf.writeUInt16LE(CHANNELS, 22);
buf.writeUInt32LE(SAMPLE_RATE, 24);
buf.writeUInt32LE(SAMPLE_RATE * CHANNELS * (BIT_DEPTH / 8), 28); // byte rate
buf.writeUInt16LE(CHANNELS * (BIT_DEPTH / 8), 32);               // block align
buf.writeUInt16LE(BIT_DEPTH, 34);
// data chunk
buf.write('data', 36);
buf.writeUInt32LE(dataSize, 40);

// Write 16-bit PCM samples
for (let i = 0; i < NUM_SAMPLES; i++) {
  const s16 = Math.round(samples[i] * 32767);
  buf.writeInt16LE(s16, headerSize + i * 2);
}

const outPath = path.join(__dirname, 'public', 'notification.wav');
fs.writeFileSync(outPath, buf);
console.log('Generated: ' + outPath + ' (' + (buf.length / 1024).toFixed(1) + ' KB)');
