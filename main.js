// Versioning
const VERSION = '1.0.0';
console.log('Cuepoints version:', VERSION);

// Global state
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

// Audio Controls
playBtn.addEventListener('click', ()=> audioEl.play());
pauseBtn.addEventListener('click', ()=> audioEl.pause());
stopBtn.addEventListener('click', ()=> { audioEl.currentTime = 0; audioEl.pause(); });

// File import
dropZone.addEventListener('click', ()=> fileInput.click());
dropZone.addEventListener('dragover', e=> e.preventDefault());
dropZone.addEventListener('drop', e=> {
    e.preventDefault();
    if(e.dataTransfer.files.length) loadFile(e.dataTransfer.files[0]);
});
fileInput.addEventListener('change', ()=> {
    if(fileInput.files.length) loadFile(fileInput.files[0]);
});

function loadFile(file){
    const url = URL.createObjectURL(file);
    audioEl.src = url;
    audioEl.load();
    initWaveform(); // redraw waveform after file load
}

// Save/Load JSON
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
