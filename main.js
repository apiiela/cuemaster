// main.js

const audioEl = document.getElementById('audioEl');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const saveBtn = document.getElementById('saveBtn');
const openBtn = document.getElementById('openBtn');
const dropZone = document.getElementById('dropZone');
const fileInput = document.getElementById('fileInput');
const timeDisplay = document.getElementById('timeDisplay');

// Audio controls
playBtn.addEventListener('click', () => audioEl.play());
pauseBtn.addEventListener('click', () => audioEl.pause());
stopBtn.addEventListener('click', () => { if(isFinite(audioEl.duration)){ audioEl.currentTime = 0; } audioEl.pause(); });

// File import
fileInput.addEventListener('change', () => {
  if(fileInput.files.length) loadAudio(fileInput.files[0]);
});
dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', (e) => e.preventDefault());
dropZone.addEventListener('drop', (e) => {
  e.preventDefault();
  if(e.dataTransfer.files.length) loadAudio(e.dataTransfer.files[0]);
});

function loadAudio(file){
  const url = URL.createObjectURL(file);
  audioEl.src = url;
  audioEl.load();
}

// Save cues/pages
saveBtn.addEventListener('click', () => {
  const blob = new Blob([JSON.stringify(pages)], {type:'application/json'});
  const a = document.createElement('a');
  a.href = URL.createObjectURL(blob);
  a.download = 'cuepoints.json';
  a.click();
});

// Load cues/pages
openBtn.addEventListener('click', () => {
  const inp = document.createElement('input');
  inp.type = 'file';
  inp.accept = '.json';
  inp.addEventListener('change', () => {
    if(inp.files.length){
      const fr = new FileReader();
      fr.onload = () => {
        pages = JSON.parse(fr.result);
        currentPage = 0;
        renderPages();
        loadPage();
      };
      fr.readAsText(inp.files[0]);
    }
  });
  inp.click();
});

// Update time display
audioEl.addEventListener('timeupdate', () => {
  const t = audioEl.currentTime;
  const ms = (t % 1).toFixed(3).substring(2);
  const s = ('0'+Math.floor(t%60)).slice(-2);
  const m = ('0'+Math.floor(t/60)).slice(-2);
  timeDisplay.textContent = `${m}:${s}.${ms}`;

  if(pages[currentPage]){
    pages[currentPage].cues.forEach(cue => {
      const [cm,cs] = cue.time.split(':');
      const [sec,millis] = cs.split('.');
      const cueTime = parseInt(cm)*60 + parseInt(sec) + parseInt(millis)/1000;
      if(Math.abs(cueTime-t) < 0.1){
        timeDisplay.classList.add('flash');
        setTimeout(() => timeDisplay.classList.remove('flash'), 200);
      }
    });
  }
});
