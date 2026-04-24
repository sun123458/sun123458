// Audio generation — creates short playable clips for each mock song
const AudioGen = (() => {
  const sampleRate = 44100;
  const cache = new Map();

  // Simple note frequencies
  const scales = {
    electronic: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00],
    jazz: [220.00, 246.94, 277.18, 293.66, 329.63, 369.99],
    acoustic: [196.00, 220.00, 246.94, 261.63, 293.66, 329.63],
    rock: [164.81, 196.00, 220.00, 246.94, 293.66, 329.63],
    lofi: [261.63, 293.66, 329.63, 349.23, 392.00, 440.00],
    classical: [261.63, 293.66, 349.23, 392.00, 440.00, 523.25],
    hiphop: [130.81, 146.83, 164.81, 196.00, 220.00, 261.63],
    world: [220.00, 246.94, 277.18, 329.63, 369.99, 440.00],
    indie: [196.00, 246.94, 293.66, 349.23, 392.00, 440.00],
    ambient: [174.61, 220.00, 261.63, 329.63, 392.00, 466.16]
  };

  function getScale(genre) {
    return scales[genre] || scales.electronic;
  }

  function generateMelody(song, ctx) {
    const scale = getScale(song.genre);
    const duration = song.duration;
    const bufferSize = Math.floor(sampleRate * duration);
    const buffer = ctx.createBuffer(2, bufferSize, sampleRate);
    const left = buffer.getChannelData(0);
    const right = buffer.getChannelData(1);

    // Build a pseudo-random but deterministic melody from the song's id
    const seed = song.id.split('').reduce((a, c) => a + c.charCodeAt(0), 0);
    const rand = (n) => { const x = Math.sin(seed * 9301 + n * 49297 + 233280) * 49297; return x - Math.floor(x); };

    const noteLen = 0.25; // 250ms per note
    const notesCount = Math.floor(duration / noteLen);
    let phase = 0;
    let noteIdx = 0;

    // Envelope parameters based on genre
    const attack = 0.02;
    const release = 0.05;
    const sustainLevel = 0.3;

    for (let i = 0; i < bufferSize; i++) {
      const t = i / sampleRate;
      const notePos = t / noteLen;
      const noteFloor = Math.floor(notePos);

      if (noteFloor !== noteIdx) {
        noteIdx = noteFloor;
        phase = 0;
      }

      const noteFraction = notePos - noteFloor;
      const noteNum = noteFloor % notesCount;
      const scaleIdx = Math.floor(rand(noteNum * 3) * scale.length);
      const noteFreq = scale[scaleIdx];

      // Octave variation
      const octave = Math.floor(rand(noteNum * 7 + 1) * 3);
      const freq = noteFreq * Math.pow(2, octave - 1);

      // ADSR envelope
      let amp;
      if (noteFraction < attack) {
        amp = noteFraction / attack;
      } else if (noteFraction < noteLen - release) {
        amp = 1.0 - (1.0 - sustainLevel) * ((noteFraction - attack) / (noteLen - release - attack));
      } else {
        amp = sustainLevel * (1.0 - (noteFraction - (noteLen - release)) / release);
      }
      amp = Math.max(0, amp) * 0.15;

      // Waveform mixing — different character per genre
      let sample = 0;
      phase += (2 * Math.PI * freq) / sampleRate;

      if (song.genre === 'electronic' || song.genre === 'lofi') {
        sample = Math.sin(phase) * 0.6 + Math.sin(phase * 2) * 0.2 + Math.sin(phase * 0.5) * 0.2;
      } else if (song.genre === 'jazz' || song.genre === 'classical') {
        sample = Math.sin(phase) * 0.5 + Math.sin(phase * 3) * 0.15 + Math.sin(phase * 0.25) * 0.35;
      } else if (song.genre === 'rock') {
        sample = Math.sin(phase) * 0.3 + (phase % (2 * Math.PI) < Math.PI ? 0.4 : -0.4);
      } else if (song.genre === 'hiphop') {
        sample = Math.sin(phase) * 0.3 + Math.sin(phase * 0.5) * 0.5;
        // Add percussive clicks on beat
        if (noteFraction < 0.02 && noteFloor % 4 === 0) {
          sample += (rand(noteFloor * 13) - 0.5) * 0.4;
        }
      } else if (song.genre === 'ambient') {
        sample = Math.sin(phase) * 0.2 + Math.sin(phase * 1.01) * 0.3 + Math.sin(phase * 0.495) * 0.3;
      } else {
        sample = Math.sin(phase) * 0.5 + Math.sin(phase * 2) * 0.25 + Math.sin(phase * 0.5) * 0.25;
      }

      // Subtle reverb — mix with delayed sample
      const delaySamples = Math.floor(sampleRate * 0.08);
      if (i > delaySamples) {
        sample += left[i - delaySamples] * 0.2;
      }

      // Fade in/out
      const fadeLen = Math.min(sampleRate * 0.5, bufferSize * 0.1);
      let fadeAmp = 1;
      if (i < fadeLen) fadeAmp = i / fadeLen;
      if (i > bufferSize - fadeLen) fadeAmp = (bufferSize - i) / fadeLen;

      const val = sample * amp * fadeAmp;
      left[i] = val * (0.7 + rand(i % 1000) * 0.3); // slight stereo variation
      right[i] = val * (0.7 + rand(1000 + i % 1000) * 0.3);
    }

    return buffer;
  }

  async function getAudioBlob(song) {
    if (cache.has(song.id)) {
      return cache.get(song.id);
    }

    const offlineCtx = new OfflineAudioContext(2, sampleRate * song.duration, sampleRate);
    const buffer = generateMelody(song, offlineCtx);

    // Create a buffer source node
    const source = offlineCtx.createBufferSource();
    source.buffer = buffer;
    source.connect(offlineCtx.destination);
    source.start(0);

    const rendered = await offlineCtx.startRendering();

    // Convert AudioBuffer to WAV blob
    const wav = audioBufferToWav(rendered);
    cache.set(song.id, wav);
    return wav;
  }

  function audioBufferToWav(buffer) {
    const numChannels = buffer.numberOfChannels;
    const sampleRate = buffer.sampleRate;
    const length = buffer.length;
    const bytesPerSample = 2;
    const blockAlign = numChannels * bytesPerSample;
    const dataSize = length * blockAlign;
    const headerSize = 44;
    const totalSize = headerSize + dataSize;

    const arrayBuffer = new ArrayBuffer(totalSize);
    const view = new DataView(arrayBuffer);

    // RIFF header
    writeString(view, 0, 'RIFF');
    view.setUint32(4, totalSize - 8, true);
    writeString(view, 8, 'WAVE');
    writeString(view, 12, 'fmt ');
    view.setUint32(16, 16, true);
    view.setUint16(20, 1, true);
    view.setUint16(22, numChannels, true);
    view.setUint32(24, sampleRate, true);
    view.setUint32(28, sampleRate * blockAlign, true);
    view.setUint16(32, blockAlign, true);
    view.setUint16(34, bytesPerSample * 8, true);
    writeString(view, 36, 'data');
    view.setUint32(40, dataSize, true);

    let offset = 44;
    for (let i = 0; i < length; i++) {
      for (let ch = 0; ch < numChannels; ch++) {
        const sample = Math.max(-1, Math.min(1, buffer.getChannelData(ch)[i]));
        const int16 = sample < 0 ? sample * 0x8000 : sample * 0x7FFF;
        view.setInt16(offset, int16, true);
        offset += 2;
      }
    }

    return new Blob([arrayBuffer], { type: 'audio/wav' });
  }

  function writeString(view, offset, str) {
    for (let i = 0; i < str.length; i++) {
      view.setUint8(offset + i, str.charCodeAt(i));
    }
  }

  async function preloadAll(songs, onProgress) {
    let loaded = 0;
    const promises = songs.map(async (song) => {
      await getAudioBlob(song);
      loaded++;
      if (onProgress) onProgress(loaded, songs.length);
    });
    await Promise.all(promises);
  }

  return { getAudioBlob, preloadAll };
})();
