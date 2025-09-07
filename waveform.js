const canvas = document.getElementById('waveform');
const ctx = canvas.getContext('2d');
const cueBanner = document.getElementById('cueBanner');
let waveformData = [];

function initWaveform(){
    if(!audioEl.src) return;
    const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
    const reader = new FileReader();

    fetch(audioEl.src)
        .then(res => res.arrayBuffer())
        .then(buf => audioCtx.decodeAudioData(buf))
        .then(decoded => {
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

    // Draw cue markers
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
