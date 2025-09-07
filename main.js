// main.js

const audioEl = document.getElementById('audioEl');
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const saveBtn = document.getElementById('saveBtn');
const openBtn = document.getElementById('openBtn');
const timeDisplay = document.getElementById('timeDisplay');

let currentAudioFile = null;

// ---------- AUDIO IMPORT ----------
function loadAudioFile(file) {
  if (!file) return;
  currentAudioFile = file;
  const url = URL.createObjectURL(file);
  audioEl.src = url;
  audioEl.load();
  audioEl.play(); // optional auto-play
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
