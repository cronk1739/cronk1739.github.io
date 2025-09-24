// Minimal music player with visualizer
(function(){
  const audio = new Audio();
  audio.crossOrigin = 'anonymous';
  const ctx = new (window.AudioContext || window.webkitAudioContext)();
  const srcNode = ctx.createMediaElementSource(audio);
  const analyser = ctx.createAnalyser(); analyser.fftSize = 2048;
  srcNode.connect(analyser); analyser.connect(ctx.destination);

  const playlistEl = document.getElementById('playlist');
  const fileInput = document.getElementById('file-input');
  const playBtn = document.getElementById('play');
  const prevBtn = document.getElementById('prev');
  const nextBtn = document.getElementById('next');
  const seek = document.getElementById('seek');
  const vol = document.getElementById('vol');
  const curTimeEl = document.getElementById('cur-time');
  const durEl = document.getElementById('dur');
  const titleEl = document.getElementById('track-title');
  const viz = document.getElementById('viz');
  const clearBtn = document.getElementById('clear');
  const shuffleBtn = document.getElementById('shuffle');
  const repeatBtn = document.getElementById('repeat');
  const addSample = document.getElementById('add-sample');

  let tracks = [];
  let current = -1;
  let raf = null;

  function formatTime(t){ if(!isFinite(t)) return '0:00'; const m = Math.floor(t/60); const s = Math.floor(t%60).toString().padStart(2,'0'); return `${m}:${s}`; }

  function addFiles(files){
    for(const f of files){
      if(!f.type.startsWith('audio')) continue;
      const url = URL.createObjectURL(f);
      tracks.push({src:url,name:f.name,artist:''});
    }
    renderPlaylist();
    if(current===-1 && tracks.length) playIndex(0);
  }

  fileInput.addEventListener('change', (e)=> addFiles(e.target.files));

  // drag/drop
  document.addEventListener('dragover', (e)=>{ e.preventDefault(); document.body.classList.add('dragging'); });
  document.addEventListener('dragleave', (e)=>{ document.body.classList.remove('dragging'); });
  document.addEventListener('drop', (e)=>{ e.preventDefault(); document.body.classList.remove('dragging'); const dt = e.dataTransfer; if(dt && dt.files) addFiles(dt.files); });

  function renderPlaylist(){
    playlistEl.innerHTML = '';
    tracks.forEach((t,i)=>{
      const li = document.createElement('li'); li.textContent = t.name || `Track ${i+1}`; li.dataset.index = i; if(i===current) li.classList.add('active'); li.addEventListener('click', ()=> playIndex(i)); playlistEl.appendChild(li);
    });
  }

  function playIndex(i){ if(i<0 || i>=tracks.length) return; current = i; audio.src = tracks[i].src; audio.play(); titleEl.textContent = tracks[i].name || 'Unknown'; renderPlaylist(); playBtn.textContent = '⏸'; ensureAudioContext(); }

  function ensureAudioContext(){ if(ctx.state==='suspended') ctx.resume(); }

  playBtn.addEventListener('click', ()=>{ if(audio.paused) { audio.play(); playBtn.textContent = '⏸'; ensureAudioContext(); } else { audio.pause(); playBtn.textContent = '▶'; } });
  prevBtn.addEventListener('click', ()=>{ if(tracks.length===0) return; const idx = getPrevIndex(); playIndex(idx); });
  nextBtn.addEventListener('click', ()=>{ if(tracks.length===0) return; const idx = getNextIndex(); playIndex(idx); });

  audio.addEventListener('timeupdate', ()=>{ seek.value = audio.duration ? (audio.currentTime / audio.duration * 100) : 0; curTimeEl.textContent = formatTime(audio.currentTime); durEl.textContent = formatTime(audio.duration); });
  seek.addEventListener('input', ()=>{ if(audio.duration) audio.currentTime = seek.value/100 * audio.duration; });
  vol.addEventListener('input', ()=>{ audio.volume = parseFloat(vol.value); });

  clearBtn.addEventListener('click', ()=>{ tracks = []; current = -1; audio.pause(); audio.src=''; renderPlaylist(); titleEl.textContent = 'No track loaded'; playBtn.textContent = '▶'; });

  // Playback modes
  let shuffle = false; // if true, pick random next
  let repeatMode = 'off'; // 'off' | 'all' | 'one'

  function updateShuffleUI(){ if(shuffle) shuffleBtn.classList.add('active'); else shuffleBtn.classList.remove('active'); shuffleBtn.title = shuffle ? 'Shuffle: On' : 'Shuffle: Off'; }
  function updateRepeatUI(){ repeatBtn.dataset.mode = repeatMode; repeatBtn.classList.toggle('active', repeatMode !== 'off'); repeatBtn.title = `Repeat: ${repeatMode}`; repeatBtn.textContent = repeatMode === 'one' ? '🔂' : '🔁'; }

  shuffleBtn.addEventListener('click', ()=>{ shuffle = !shuffle; updateShuffleUI(); });
  // cycle repeat modes: off -> all -> one -> off
  repeatBtn.addEventListener('click', ()=>{ if(repeatMode === 'off') repeatMode = 'all'; else if(repeatMode === 'all') repeatMode = 'one'; else repeatMode = 'off'; updateRepeatUI(); });
  updateShuffleUI(); updateRepeatUI();

  addSample.addEventListener('click', ()=>{
    // small free sample tone created via oscillator and recorded to blob (quick demo)
    const octx = new (window.OfflineAudioContext || window.webkitOfflineAudioContext)(1, 44100*2, 44100);
    const osc = octx.createOscillator(); osc.frequency.value = 440; const gain = octx.createGain(); gain.gain.setValueAtTime(0.0001,0); gain.gain.linearRampToValueAtTime(0.15,0.02); gain.gain.linearRampToValueAtTime(0.0001,1.8); osc.connect(gain); gain.connect(octx.destination); osc.start(0); osc.stop(1.8);
    octx.startRendering().then(buff=>{
      const wav = audioBufferToWav(buff);
      const blob = new Blob([new DataView(wav)], {type:'audio/wav'});
      const url = URL.createObjectURL(blob); tracks.push({src:url,name:'Sample Tone'}); renderPlaylist(); if(current===-1) playIndex(0);
    });
  });

  // next/prev logic respecting shuffle and repeat
  function getNextIndex(){ if(tracks.length===0) return -1; if(repeatMode === 'one') return current; if(shuffle) return Math.floor(Math.random() * tracks.length); const next = (current + 1) % tracks.length; if(next === 0 && repeatMode === 'off' && current === tracks.length - 1) return -1; return next; }
  function getPrevIndex(){ if(tracks.length===0) return -1; if(repeatMode === 'one') return current; if(shuffle) return Math.floor(Math.random() * tracks.length); const prev = (current - 1 + tracks.length) % tracks.length; return prev; }

  audio.addEventListener('ended', ()=>{
    const idx = getNextIndex(); if(idx === -1){ audio.pause(); playBtn.textContent = '▶'; return; } playIndex(idx);
  });

  // simple visualizer
  const canvas = viz; const c = canvas.getContext('2d'); function drawViz(){ const w=canvas.width; const h=canvas.height; const data = new Uint8Array(analyser.frequencyBinCount); analyser.getByteFrequencyData(data); c.clearRect(0,0,w,h); const barWidth = (w / data.length) * 2.5; let x=0; for(let i=0;i<data.length;i+=4){ const v = data[i]/255; const yh = v * h; const hue = 200 - (v*200); c.fillStyle = `hsl(${hue} 80% ${Math.round(40 + v*40)}%)`; c.fillRect(x, h-yh, barWidth, yh); x += barWidth + 1; } raf = requestAnimationFrame(drawViz); }
  function startViz(){ if(raf) cancelAnimationFrame(raf); drawViz(); }
  audio.addEventListener('play', startViz); audio.addEventListener('pause', ()=>{ if(raf) cancelAnimationFrame(raf); });

  // helpers
  function audioBufferToWav(buffer, opt){ opt = opt || {}; var numChannels = buffer.numberOfChannels; var sampleRate = buffer.sampleRate; var format = 1; var bitDepth = 16; var result; if(numChannels === 2){ var interleaved = interleave(buffer.getChannelData(0), buffer.getChannelData(1)); result = encodeWAV(interleaved, numChannels, sampleRate, bitDepth); } else { result = encodeWAV(buffer.getChannelData(0), numChannels, sampleRate, bitDepth); } return result.buffer; function interleave(inputL, inputR){ var length = inputL.length + inputR.length; var result = new Float32Array(length); var index = 0; var inputIndex = 0; while(index < length){ result[index++] = inputL[inputIndex]; result[index++] = inputR[inputIndex]; inputIndex++; } return result; } function encodeWAV(samples, numChannels, sampleRate, bitDepth){ var bytesPerSample = bitDepth/8; var blockAlign = numChannels * bytesPerSample; var buffer = new ArrayBuffer(44 + samples.length * bytesPerSample); var view = new DataView(buffer); function writeString(view, offset, string){ for(var i=0;i<string.length;i++){ view.setUint8(offset + i, string.charCodeAt(i)); } } var offset=0; writeString(view, offset, 'RIFF'); offset += 4; view.setUint32(offset, 36 + samples.length * bytesPerSample, true); offset += 4; writeString(view, offset, 'WAVE'); offset += 4; writeString(view, offset, 'fmt '); offset += 4; view.setUint32(offset, 16, true); offset += 4; view.setUint16(offset, format, true); offset += 2; view.setUint16(offset, numChannels, true); offset += 2; view.setUint32(offset, sampleRate, true); offset += 4; view.setUint32(offset, sampleRate * blockAlign, true); offset += 4; view.setUint16(offset, blockAlign, true); offset += 2; view.setUint16(offset, bitDepth, true); offset += 2; writeString(view, offset, 'data'); offset += 4; view.setUint32(offset, samples.length * bytesPerSample, true); offset += 4; if(bitDepth === 16){ var lng = samples.length; var index = 0; var volume = 1; while(index < lng){ var s = Math.max(-1, Math.min(1, samples[index])); view.setInt16(offset, s < 0 ? s * 0x8000 : s * 0x7FFF, true); offset += 2; index++; } } return view; }
  }

  // keyboard
  document.addEventListener('keydown', (e)=>{
    if(e.code === 'Space'){ e.preventDefault(); if(audio.paused) audio.play(); else audio.pause(); playBtn.textContent = audio.paused ? '▶' : '⏸'; }
    if(e.key === 'ArrowRight') audio.currentTime = Math.min(audio.duration || 0, (audio.currentTime || 0) + 5);
    if(e.key === 'ArrowLeft') audio.currentTime = Math.max(0, (audio.currentTime || 0) - 5);
  });

  // resize canvas to device pixel ratio
  function resizeCanvas(){ const dpr = window.devicePixelRatio || 1; canvas.width = Math.floor(canvas.clientWidth * dpr); canvas.height = Math.floor(canvas.clientHeight * dpr); }
  window.addEventListener('resize', resizeCanvas); resizeCanvas();

  // expose a small API for testing
  window.__miniMusic = { addFiles, get tracks(){ return tracks; } };
})();
