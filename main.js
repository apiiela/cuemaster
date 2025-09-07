// Version
const VERSION = '1.0.1';
console.log('Cuepoints version:', VERSION);

// Globals
let pages = [];
let currentPage = 0;
const audioEl = document.getElementById('audioEl');
const fileInput = document.getElementById('fileInput');
const dropZone = document.getElementById('dropZone');
const playBtn = document.getElementById('playBtn');
const pauseBtn = document.getElementById('pauseBtn');
const stopBtn = document.getElementById('stopBtn');
const saveBtn = document.getElementById('saveBtn');
const openBtn = document.getElementById('openBtn');
const addCueBtn = document.getElementById('addCueBtn');
const cueTableBody = document.getElementById('cueTableBody');
const playlistEl = document.getElementById('playlist');
const canvas = document.getElementById('waveform');
const ctx = canvas.getContext('2d');
const cueBanner = document.getElementById('cueBanner');
let waveformData = [];

// -------------------- Pages --------------------
function addPage(name="Page", color="#333"){
    pages.push({name, color, cues: []});
    currentPage = pages.length-1;
    renderPages();
    loadPage();
    drawWaveform();
}

function renderPages(){
    playlistEl.innerHTML = '';
    pages.forEach((p,i)=>{
        const btn = document.createElement('div');
        btn.className = 'page-btn';
        btn.style.background = p.color || '#333';

        const label = document.createElement('span');
        label.textContent = p.name;
        label.className = 'page-label';
        btn.appendChild(label);

        label.addEventListener('dblclick', ev=>{
            ev.stopPropagation();
            const input = document.createElement('input');
            input.value = p.name;
            input.className = 'rename-input';
            btn.innerHTML = '';
            btn.appendChild(input);
            input.focus();
            input.select();
            input.addEventListener('blur', ()=>{ p.name = input.value||p.name; renderPages(); });
            input.addEventListener('keydown', ev=>{ if(ev.key==='Enter'){ p.name=input.value||p.name; renderPages(); } });
        });

        const rm = document.createElement('button');
        rm.textContent = '✕';
        rm.className = 'remove-btn';
        rm.addEventListener('click', ev=>{
            ev.stopPropagation();
            if(confirm('Remove page "'+p.name+'"?')){
                pages.splice(i,1);
                if(currentPage >= pages.length) currentPage = Math.max(0, pages.length-1);
                renderPages();
                loadPage();
                drawWaveform();
            }
        });
        btn.appendChild(rm);

        btn.addEventListener('click', ()=>{ currentPage=i; loadPage(); drawWaveform(); });

        playlistEl.appendChild(btn);
    });
}

// -------------------- Cues --------------------
function loadPage(){
    cueTableBody.innerHTML = '';
    if(!pages[currentPage]) return;
    pages[currentPage].cues.forEach((cue,j)=>{
        const tr = document.createElement('tr');
        tr.innerHTML = `
            <td>${cue.time}</td>
            <td><input value="${cue.name||''}" data-field="name" data-i="${j}"/></td>
            <td><input class="notes" value="${cue.note||''}" data-field="note" data-i="${j}"/></td>
            <td><input type="color" value="${cue.color||'#5b8cff'}" data-field="color" data-i="${j}"/></td>
            <td><button data-i="${j}" class="del">Delete</button></td>
        `;
        tr.querySelectorAll('input').forEach(inp=>{
            inp.addEventListener('input', ()=>{
                const field = inp.dataset.field;
                pages[currentPage].cues[j][field] = inp.value;
                drawWaveform();
            });
        });
        tr.querySelector('.del').addEventListener('click', ()=>{
            pages[currentPage].cues.splice(j,1);
            loadPage();
            drawWaveform();
        });
        cueTableBody.appendChild(tr);
    });
}

// Add Cue
addCueBtn.addEventListener('click', ()=>{
    if(!pages[currentPage]) return;
    const t = audioEl.currentTime || 0;
    const ms = (t%1).toFixed(3).substring(2);
    const s = ('0'+Math.floor(t%60)).slice(-2);
    const m = ('0'+Math.floor(t/60)).slice(-2);
    const timeStr = `${m}:${s}.${ms}`;
    pages[currentPage].cues.push({time:timeStr,name:'',note:'',color:'#5b8cff'});
    loadPage();
    drawWaveform();
});

// -------------------- Audio --------------------
playBtn.addEventListener('click', ()=> audioEl.play());
pauseBtn.addEventListener('click', ()=> audioEl.pause());
stopBtn.addEventListener('click', ()=> { audioEl.currentTime = 0; audioEl.pause(); });

dropZone.addEventListener('click', ()=> fileInput.click());
dropZone.addEventListener('dragover', e=> e.preventDefault());
dropZone.addEventListener('drop', e=>{
    e.preventDefault();
    if(e.dataTransfer.files.length) loadFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', ()=> { if(fileInput.files.length) loadFile(fileInput.files[0]); });

function loadFile(file){
    const url = URL.createObjectURL(file);
    audioEl.src = url;
    audioEl.load();
    audioEl.onloadedmetadata = ()=> {
        initWaveform();
        drawWaveform();
    }
}

// Save/Load
saveBtn.addEventListener('click', ()=>{
    const blob = new Blob([JSON.stringify(pages)], {type:'application/json'});
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = 'cuepoints.json';
    a.click();
});

openBtn.addEventListener('click', ()=>{
    const inp = document.createElement('input');
    inp.type = 'file';
    inp.accept = '.json';
    inp.addEventListener('change', ()=>{
        if(inp.files.length){
            const fr = new FileReader();
            fr.onload = ()=>{
                pages = JSON.parse(fr.result);
                currentPage = 0;
                renderPages();
                loadPage();
                drawWaveform();
            };
            fr.readAsText(inp.files[0]);
        }
    });
    inp.click();
});

// -------------------- Waveform --------------------
function initWaveform(){
    if(!audioEl.src) return;
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    fetch(audioEl.src)
        .then(res=>res.arrayBuffer())
        .then(buf=>audioCtx.decodeAudioData(buf))
        .then(decoded=>{
            waveformData = decoded.getChannelData(0);
            drawWaveform();
        });
}

function drawWaveform(){
    if(!canvas || !waveformData.length) return;
    ctx.clearRect(0,0,canvas.width,canvas.height);
    const w = canvas.width;
    const h = canvas.height;
    const step = Math.ceil(waveformData.length / w);

    for(let i=0; i<w; i++){
        const min = waveformData[i*step];
        const y = (1 + min) * 0.5 * h;
        ctx.fillStyle = '#5b8cff';
        ctx.fillRect(i, h/2, 1, y - h/2);
    }

    // Cue markers
    if(pages[currentPage]){
        pages[currentPage].cues.forEach(cue=>{
            const [m,sms] = cue.time.split(':');
            const [s,ms] = sms.split('.');
            const tSec = parseInt(m)*60 + parseInt(s) + parseInt(ms)/1000;
            const x = (tSec / audioEl.duration) * w;
            ctx.fillStyle = cue.color;
            ctx.fillRect(x,0,2,h);
        });
    }
}

// Click to seek
canvas.addEventListener('click', e=>{
    if(!audioEl.duration) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const w = canvas.width;
    const time = (x / w) * audioEl.duration;
    audioEl.currentTime = time;
});

// Hover cue banner
canvas.addEventListener('mousemove', e=>{
    if(!pages[currentPage]) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const w = canvas.width;

    const hoveredCue = pages[currentPage].cues.find(cue=>{
        const [m,sms] = cue.time.split(':');
        const [s,ms] = sms.split('.');
        const tSec = parseInt(m)*60 + parseInt(s) + parseInt(ms)/1000;
        const cx = (tSec / audioEl.duration) * w;
        return Math.abs(cx - x) < 4;
    });

    if(hoveredCue){
        cueBanner.style.display = 'block';
        cueBanner.style.left = e.pageX + 'px';
        cueBanner.style.top = e.pageY - 20 + 'px';
        cueBanner.textContent = hoveredCue.name || '(unnamed)';
        cueBanner.style.background = hoveredCue.color;
    } else {
        cueBanner.style.display = 'none';
    }
});

canvas.addEventListener('mouseout', ()=> cueBanner.style.display='none');

// -------------------- Init --------------------
addPage("Page 1");
