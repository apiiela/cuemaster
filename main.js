// Cuepoints Main.js — Full Version 1.2
// Handles pages, cues, audio import, waveform, markers, timecode, and controls

console.log('Cuepoints Module Version 1.2');

// DOM Elements
const playlistEl = document.getElementById('playlist');
const newPageBtn = document.getElementById('newPageBtn');
const audioEl = document.getElementById('audioEl');
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
const canvas = document.getElementById('waveform');
const ctx = canvas.getContext('2d');

// State
let pages = [];
let currentPage = 0;
let audioBuffer = null;
let audioContext = new (window.AudioContext || window.webkitAudioContext)();
let sourceNode = null;
let animationFrame = null;

// --- Pages ---
function addPage(name = 'Page', color = '#333') {
    pages.push({ name, color, cues: [] });
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
        btn.style.background = p.color || '#333';

        const label = document.createElement('span');
        label.textContent = p.name;
        label.className = 'page-label';

        btn.addEventListener('click', () => { currentPage = i; loadPage(); drawWaveform(); });

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
            input.addEventListener('keydown', (ev) => { if (ev.key === 'Enter') { p.name = input.value || p.name; renderPages(); } });
        });

        const rm = document.createElement('button');
        rm.textContent = '✕';
        rm.className = 'remove-btn';
        rm.addEventListener('click', (ev) => {
            ev.stopPropagation();
            if (confirm(`Remove page "${p.name}"?`)) {
                pages.splice(i, 1);
                currentPage = Math.min(currentPage, pages.length - 1);
                renderPages();
                loadPage();
                drawWaveform();
            }
        });

        btn.appendChild(label);
        btn.appendChild(rm);
        playlistEl.appendChild(btn);
    });
}

function loadPage() {
    cueTableBody.innerHTML = '';
    if (!pages[currentPage]) return;
    pages[currentPage].cues.forEach((cue, j) => {
        const tr = document.createElement('tr');
        tr.innerHTML = `<td>${cue.time}</td>
                        <td><input value="${cue.name || ''}" data-field="name" data-i="${j}"/></td>
                        <td><input class="notes" value="${cue.note || ''}" data-field="note" data-i="${j}"/></td>
                        <td><input type="color" value="${cue.color || '#5b8cff'}" data-field="color" data-i="${j}"/></td>
                        <td><button data-i="${j}" class="del">Delete</button></td>`;
        tr.querySelectorAll('input').forEach(inp => {
            inp.addEventListener('input', () => {
                const field = inp.dataset.field;
                pages[currentPage].cues[j][field] = inp.value;
                drawWaveform();
            });
        });
        tr.querySelector('.del').addEventListener('click', () => {
            pages[currentPage].cues.splice(j, 1);
            loadPage();
            drawWaveform();
        });
        cueTableBody.appendChild(tr);
    });
}

// --- Audio Import ---
function loadAudioFile(file) {
    const reader = new FileReader();
    reader.onload = async () => {
        const arrayBuffer = reader.result;
        audioBuffer = await audioContext.decodeAudioData(arrayBuffer);
        drawWaveform();
        audioEl.src = URL.createObjectURL(file);
        audioEl.load();
    };
    reader.readAsArrayBuffer(file);
}

dropZone.addEventListener('click', () => fileInput.click());
dropZone.addEventListener('dragover', e => e.preventDefault());
dropZone.addEventListener('drop', e => { e.preventDefault(); if (e.dataTransfer.files.length) loadAudioFile(e.dataTransfer.files[0]); });
fileInput.addEventListener('change', () => { if (fileInput.files.length) loadAudioFile(fileInput.files[0]); });

// --- Audio Controls ---
playBtn.addEventListener('click', () => { audioEl.play(); });
pauseBtn.addEventListener('click', () => { audioEl.pause(); });
stopBtn.addEventListener('click', () => { audioEl.pause(); audioEl.currentTime = 0; });

addCueBtn.addEventListener('click', () => {
    if (!pages[currentPage]) return;
    const t = audioEl.currentTime || 0;
    const ms = (t % 1).toFixed(3).substring(2);
    const s = ('0' + Math.floor(t % 60)).slice(-2);
    const m = ('0' + Math.floor(t / 60)).slice(-2);
    const timeStr = `${m}:${s}.${ms}`;
    pages[currentPage].cues.push({ time: timeStr, name: '', note: '', color: '#5b8cff', position: t });
    loadPage();
});

// --- Save / Load ---
saveBtn.addEventListener('click', () => {
    const blob = new Blob([JSON.stringify(pages)], { type: 'application/json' });
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

// --- Timecode Update ---
audioEl.addEventListener('timeupdate', () => {
    const t = audioEl.currentTime;
    const ms = (t % 1).toFixed(3).substring(2);
    const s = ('0' + Math.floor(t % 60)).slice(-2);
    const m = ('0' + Math.floor(t / 60)).slice(-2);
    timeDisplay.textContent = `${m}:${s}.${ms}`;
    drawWaveform();

    // Flash cues
    if (pages[currentPage]) {
        pages[currentPage].cues.forEach(cue => {
            if (Math.abs(cue.position - t) < 0.1) {
                timeDisplay.classList.add('flash');
                setTimeout(() => timeDisplay.classList.remove('flash'), 200);
            }
        });
    }
});

// --- Waveform Drawing ---
function drawWaveform() {
    ctx.clearRect(0, 0, canvas.width, canvas.height);
    if (!audioBuffer) return;
    const { length, numberOfChannels, duration } = audioBuffer;
    const channelData = audioBuffer.getChannelData(0);
    const width = canvas.width;
    const height = canvas.height;
    const step = Math.ceil(channelData.length / width);

    // Draw waveform
    ctx.fillStyle = '#051019';
    ctx.fillRect(0, 0, width, height);
    ctx.strokeStyle = '#5b8cff';
    ctx.beginPath();
    for (let i = 0; i < width; i++) {
        const min = channelData[i * step];
        const y = (1 - min) * height / 2;
        ctx.lineTo(i, y);
    }
    ctx.stroke();

    // Draw cue markers
    if (pages[currentPage]) {
        pages[currentPage].cues.forEach(cue => {
            const x = (cue.position / duration) * width;
            ctx.strokeStyle = cue.color;
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, height);
            ctx.lineWidth = 1.5;
            ctx.stroke();
        });
    }

    // Draw current playback line
    if (!isNaN(audioEl.currentTime)) {
        const x = (audioEl.currentTime / duration) * width;
        ctx.strokeStyle = '#22c55e';
        ctx.lineWidth = 2;
        ctx.beginPath();
        ctx.moveTo(x, 0);
        ctx.lineTo(x, height);
        ctx.stroke();
    }
}

// --- Seek by clicking waveform ---
canvas.addEventListener('click', e => {
    if (!audioBuffer) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const seekTime = (x / canvas.width) * audioBuffer.duration;
    audioEl.currentTime = seekTime;
});

// --- Cue Hover Banner ---
canvas.addEventListener('mousemove', e => {
    if (!pages[currentPage]) return;
    const rect = canvas.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const width = canvas.width;
    const duration = audioBuffer ? audioBuffer.duration : 1;
    let found = false;
    pages[currentPage].cues.forEach(cue => {
        const cueX = (cue.position / duration) * width;
        if (Math.abs(cueX - x) < 5) {
            cueBanner.textContent = cue.name || '(unnamed)';
            cueBanner.style.background = cue.color;
            cueBanner.style.display = 'block';
            cueBanner.style.left = e.pageX + 'px';
            cueBanner.style.top = e.pageY - 30 + 'px';
            cueBanner.style.transition = 'all 0.2s ease';
            found = true;
        }
    });
    if (!found) cueBanner.style.display = 'none';
});

// Init
addPage('Page 1');
