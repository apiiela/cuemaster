// main.js — Version 1.1
console.log("Cuepoints Module Version 1.1");

const audioEl = document.getElementById('audioEl');
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const saveBtn = document.getElementById('saveBtn');
const openBtn = document.getElementById('openBtn');
const timeDisplay = document.getElementById('timeDisplay');
const waveformCanvas = document.getElementById('waveform');
const ctx = waveformCanvas.getContext('2d');
const cueBanner = document.getElementById('cueBanner');

let currentAudioFile = null;
let audioBuffer = null;
let audioCtx = new (window.AudioContext || window.webkitAudioContext)();

// ---------- AUDIO IMPORT ----------
function loadAudioFile(file) {
  if (!file) return;
  currentAudioFile = file;
  const url = URL.createObjectURL(file);
  audioEl.src = url;
  audioEl.load();

  // Decode for waveform
  const reader = new FileReader();
  reader.onload = async (e) => {
    const arrayBuffer = e.target.result;
    audioBuffer = await audioCtx.decodeAudioData(arrayBuffer);
    drawWaveform();
  };
  reader.readAsArrayBuffer(file);
}

// File input
fileInput.addEventListener('change', () => {
  const file = fileInput.files[0];
  loadAudioFile(file);
});

// Drop zone
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => e.preventDefault());
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  const file = e.dataTransfer.files[0];
  loadAudioFile(file);
});

// ---------- AUDIO CONTROLS ----------
playBtn.addEventListener('click', () => audioEl.play());
pauseBtn.addEventListener('click', () => audioEl.pause());
stopBtn.addEventListener('click', () => {
  if (isFinite(audioEl.duration)) audioEl.currentTime = 0;
  audioEl.pause();
});

// ---------- TIME DISPLAY ----------
audioEl.addEventListener('timeupdate', () => {
  const t = audioEl.currentTime;
  const ms = (t % 1).toFixed(3).substring(2);
  const s = ('0' + Math.floor(t % 60)).slice(-2);
  const m = ('0' + Math.floor(t / 60)).slice(-2);
  timeDisplay.textContent = `${m}:${s}.${ms}`;

  // Flash on cue
  if (pages[currentPage]) {
    pages[currentPage].cues.forEach(cue => {
      const [cm, cs] = cue.time.split(':');
      const [sec, millis] = cs.split('.');
      const cueTime = parseInt(cm)*60 + parseInt(sec) + parseInt(millis)/1000;
      if (Math.abs(cueTime - t) < 0.1) {
        timeDisplay.classList.add('flash');
        setTimeout(() => timeDisplay.classList.remove('flash'), 200);
      }
    });
  }

  drawWaveform(); // update marker position
});

// ---------- SAVE / LOAD ----------
saveBtn.addEventListener('click', () => {
  const data = {
    pages,
    audioFileName: currentAudioFile ? currentAudioFile.name : null
  };
  const blob = new Blob([JSON.stringify(data)], { type: 'application/json' });
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'cuepoints.json';
  a.click();
});

openBtn.addEventListener('click', () => {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = '.json';
  inp.addEventListener('change', () => {
    if (inp.files.length) {
      const fr = new FileReader();
      fr.onload = () => {
        const data = JSON.parse(fr.result);
        pages = data.pages || [];
        currentPage = 0;
        renderPages();
        loadPage();

        if (data.audioFileName) {
          alert('Please re-import the audio file: ' + data.audioFileName);
        }
      };
      fr.readAsText(inp.files[0]);
    }
  });
  inp.click();
});

// ---------- WAVEFORM DRAWING ----------
function drawWaveform() {
  if (!audioBuffer) return;
  const width = waveformCanvas.width = waveformCanvas.clientWidth;
  const height = waveformCanvas.height = waveformCanvas.clientHeight;
  ctx.clearRect(0, 0, width, height);

  const channelData = audioBuffer.getChannelData(0);
  const step = Math.ceil(channelData.length / width);
  ctx.fillStyle = '#333';
  for (let i = 0; i < width; i++) {
    const min = Math.min(...channelData.slice(i*step, (i+1)*step));
    const max = Math.max(...channelData.slice(i*step, (i+1)*step));
    ctx.fillRect(i, (1+min)*0.5*height, 1, Math.max(1,(max-min)*0.5*height));
  }

  // Draw cue markers
  if (pages[currentPage]) {
    pages[currentPage].cues.forEach(cue => {
      const [cm, cs] = cue.time.split(':');
      const [sec, millis] = cs.split('.');
      const cueTime = parseInt(cm)*60 + parseInt(sec) + parseInt(millis)/1000;
      const x = (cueTime/audioEl.duration) * width;
      ctx.fillStyle = cue.color || '#5b8cff';
      ctx.fillRect(x, 0, 2, height);
    });
  }

  // Draw current playhead
  if (audioEl.duration) {
    const x = (audioEl.currentTime / audioEl.duration) * width;
    ctx.strokeStyle = '#fff';
    ctx.beginPath();
    ctx.moveTo(x, 0);
    ctx.lineTo(x, height);
    ctx.stroke();
  }
}

// ---------- HOVER CUE BANNERS ----------
waveformCanvas.addEventListener('mousemove', e => {
  if (!pages[currentPage] || !audioEl.duration) return;
  const rect = waveformCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const width = rect.width;

  // Find nearest cue
  const cues = pages[currentPage].cues;
  let nearest = null;
  let dist = Infinity;
  cues.forEach(cue => {
    const [cm, cs] = cue.time.split(':');
    const [sec, millis] = cs.split('.');
    const cueTime = parseInt(cm)*60 + parseInt(sec) + parseInt(millis)/1000;
    const cx = (cueTime / audioEl.duration) * width;
    if (Math.abs(cx - x) < dist && Math.abs(cx - x) < 10) { // 10px threshold
      nearest = cue;
      dist = Math.abs(cx - x);
    }
  });

  if (nearest) {
    cueBanner.style.display = 'block';
    cueBanner.style.left = e.pageX + 'px';
    cueBanner.style.top = (rect.top + window.scrollY - 30) + 'px';
    cueBanner.textContent = nearest.name || '(unnamed)';
    cueBanner.style.background = nearest.color || '#5b8cff';
  } else {
    cueBanner.style.display = 'none';
  }
});

waveformCanvas.addEventListener('mouseout', () => cueBanner.style.display = 'none');
