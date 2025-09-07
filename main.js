// Cuepoints Module Version 1.1

// ===== Globals =====
let pages = [];
let currentPage = 0;
let audioEl = document.getElementById('audioEl');
let ctx, canvasWidth, canvasHeight;

// ===== DOM Elements =====
const playlistEl = document.getElementById('playlist');
const newPageBtn = document.getElementById('newPageBtn');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const addCueBtn = document.getElementById('addCueBtn');
const saveBtn = document.getElementById('saveBtn');
const openBtn = document.getElementById('openBtn');
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const timeDisplay = document.getElementById('timeDisplay');
const cueTableBody = document.getElementById('cueTableBody');
const cueBanner = document.getElementById('cueBanner');
const waveformCanvas = document.getElementById('waveform');

// ===== Init Canvas =====
ctx = waveformCanvas.getContext('2d');
canvasWidth = waveformCanvas.width = waveformCanvas.offsetWidth;
canvasHeight = waveformCanvas.height = waveformCanvas.offsetHeight;

// ===== Pages =====
function addPage(name="Page") {
  pages.push({name, color: '#333', cues: []});
  currentPage = pages.length - 1;
  renderPages();
  loadPage();
}

newPageBtn.addEventListener('click', () => addPage(`Page ${pages.length + 1}`));

function renderPages() {
  playlistEl.innerHTML = '';
  pages.forEach((p, i) => {
    const btn = document.createElement('div');
    btn.className = 'page-btn';
    btn.style.background = p.color;

    const label = document.createElement('span');
    label.textContent = p.name;
    label.className = 'page-label';

    btn.addEventListener('click', () => { currentPage = i; loadPage(); });

    label.addEventListener('dblclick', (ev) => {
      ev.stopPropagation();
      const input = document.createElement('input');
      input.value = p.name;
      input.className = 'rename-input';
      btn.innerHTML = '';
      btn.appendChild(input);
      input.focus();
      input.select();
      input.addEventListener('blur', () => { p.name = input.value || p.name; renderPages(); });
      input.addEventListener('keydown', (ev) => { if(ev.key==='Enter'){p.name=input.value||p.name; renderPages();} });
    });

    const rm = document.createElement('button');
    rm.textContent = '✕';
    rm.className = 'remove-btn';
    rm.addEventListener('click', (ev) => {
      ev.stopPropagation();
      if(confirm(`Remove page "${p.name}"?`)) {
        pages.splice(i,1);
        currentPage = Math.max(0,pages.length-1);
        renderPages();
        loadPage();
      }
    });

    btn.appendChild(label);
    btn.appendChild(rm);
    playlistEl.appendChild(btn);
  });
}

function loadPage() {
  cueTableBody.innerHTML='';
  if(!pages[currentPage]) return;
  pages[currentPage].cues.forEach((cue,j)=>{
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${cue.time}</td>
      <td><input value="${cue.name||''}" data-field="name" data-i="${j}"/></td>
      <td><input class="notes" value="${cue.note||''}" data-field="note" data-i="${j}"/></td>
      <td><input type="color" value="${cue.color||'#5b8cff'}" data-field="color" data-i="${j}"/></td>
      <td><button data-i="${j}" class="del">Delete</button></td>`;

    tr.querySelectorAll('input').forEach(inp=>{
      inp.addEventListener('input',()=>{
        const field=inp.dataset.field;
        pages[currentPage].cues[j][field]=inp.value;
      });
    });

    tr.querySelector('.del').addEventListener('click',()=>{
      pages[currentPage].cues.splice(j,1);
      loadPage();
    });

    cueTableBody.appendChild(tr);
  });
  drawWaveform();
}

// ===== Audio Import =====
function loadAudioFile(file){
  const url = URL.createObjectURL(file);
  audioEl.src = url;
  audioEl.load();
}

dropZone.addEventListener('click', ()=>fileInput.click());
dropZone.addEventListener('dragover', e=>e.preventDefault());
dropZone.addEventListener('drop', e=>{
  e.preventDefault();
  if(e.dataTransfer.files.length) loadAudioFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', ()=>{ if(fileInput.files.length) loadAudioFile(fileInput.files[0]); });

// ===== Cue Button =====
addCueBtn.addEventListener('click', ()=>{
  if(!pages[currentPage]) return;
  const t = audioEl.currentTime || 0;
  const ms = (t%1).toFixed(3).substring(2);
  const s = ('0'+Math.floor(t%60)).slice(-2);
  const m = ('0'+Math.floor(t/60)).slice(-2);
  const timeStr = `${m}:${s}.${ms}`;
  pages[currentPage].cues.push({time:timeStr,name:'',note:'',color:'#5b8cff'});
  loadPage();
});

// ===== Audio Controls =====
playBtn.addEventListener('click', ()=>audioEl.play());
pauseBtn.addEventListener('click', ()=>audioEl.pause());
stopBtn.addEventListener('click', ()=>{audioEl.currentTime=0; audioEl.pause();});

// ===== Save/Load =====
saveBtn.addEventListener('click', ()=>{
  const blob = new Blob([JSON.stringify(pages)],{type:'application/json'});
  const a = document.createElement('a'); a.href=URL.createObjectURL(blob); a.download='cuepoints.json'; a.click();
});
openBtn.addEventListener('click', ()=>{
  const inp=document.createElement('input'); inp.type='file'; inp.accept='.json';
  inp.addEventListener('change', ()=>{
    if(inp.files.length){
      const fr=new FileReader();
      fr.onload=()=>{ pages=JSON.parse(fr.result); currentPage=0; renderPages(); loadPage(); };
      fr.readAsText(inp.files[0]);
    }
  });
  inp.click();
});

// ===== Time Update =====
audioEl.addEventListener('timeupdate', ()=>{
  const t = audioEl.currentTime;
  const ms = (t%1).toFixed(3).substring(2);
  const s = ('0'+Math.floor(t%60)).slice(-2);
  const m = ('0'+Math.floor(t/60)).slice(-2);
  timeDisplay.textContent=`${m}:${s}.${ms}`;

  if(pages[currentPage]){
    pages[currentPage].cues.forEach(cue=>{
      const [cm,cs] = cue.time.split(':');
      const [sec,millis] = cs.split('.');
      const cueTime = parseInt(cm)*60 + parseInt(sec) + parseInt(millis)/1000;
      if(Math.abs(cueTime-t)<0.1){
        timeDisplay.classList.add('flash');
        setTimeout(()=>timeDisplay.classList.remove('flash'),200);
      }
    });
  }
  drawWaveform();
});

// ===== Waveform Drawing =====
function drawWaveform(){
  ctx.clearRect(0,0,canvasWidth,canvasHeight);
  if(!audioEl.buffered || !audioEl.duration) return;
  const numCues = pages[currentPage]?.cues.length || 0;

  // Draw waveform background
  ctx.fillStyle='#051019';
  ctx.fillRect(0,0,canvasWidth,canvasHeight);

  // Draw cue markers
  for(let i=0;i<numCues;i++){
    const cue = pages[currentPage].cues[i];
    const [cm,cs] = cue.time.split(':');
    const [sec,millis] = cs.split('.');
    const cueTime = parseInt(cm)*60 + parseInt(sec) + parseInt(millis)/1000;
    const x = (cueTime/audioEl.duration)*canvasWidth;
    ctx.fillStyle = cue.color || '#5b8cff';
    ctx.fillRect(x,0,2,canvasHeight);
  }
}

// ===== Waveform Click Seek =====
waveformCanvas.addEventListener('click', (e)=>{
  const rect = waveformCanvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const pct = x / canvasWidth;
  if(audioEl.duration) audioEl.currentTime = pct * audioEl.duration;
});

// ===== Cue Hover Banner =====
cueTableBody.addEventListener('mouseover', (e)=>{
  const row = e.target.closest('tr');
  if(!row) return;
  const i = [...cueTableBody.children].indexOf(row);
  const cue = pages[currentPage].cues[i];
  if(!cue) return;
  cueBanner.textContent = cue.name || '(unnamed)';
  cueBanner.style.background = cue.color;
  cueBanner.style.display='block';
  cueBanner.style.left = e.pageX+'px';
  cueBanner.style.top = e.pageY+'px';
});
cueTableBody.addEventListener('mousemove', (e)=>{
  if(cueBanner.style.display==='block'){
    cueBanner.style.left = e.pageX+'px';
    cueBanner.style.top = e.pageY+'px';
  }
});
cueTableBody.addEventListener('mouseout', ()=>{cueBanner.style.display='none';});

// ===== Init =====
addPage('Page 1');
