// waveform.js
const canvas = document.getElementById('waveform');
const ctx = canvas.getContext('2d');
let waveformData = [];
let markerPositions = [];

function drawWaveform(){
  const width = canvas.width;
  const height = canvas.height;
  ctx.clearRect(0, 0, width, height);

  if(!waveformData.length) return;

  ctx.fillStyle = '#5b8cff';
  waveformData.forEach((v, i) => {
    const x = i / waveformData.length * width;
    const y = (v * 0.5 + 0.5) * height;
    ctx.fillRect(x, height/2 - y/2, 1, y);
  });

  // draw markers
  markerPositions.forEach(marker => {
    ctx.fillStyle = marker.color || '#22c55e';
    const x = marker.timeRatio * width;
    ctx.fillRect(x-2, 0, 4, height);
  });
}

function updateMarkers(){
  if(!pages[currentPage]) return;
  markerPositions = pages[currentPage].cues.map(cue => {
    const [m,sms] = cue.time.split(':');
    const [s, ms] = sms.split('.');
    const cueTime = parseInt(m)*60 + parseInt(s) + parseInt(ms)/1000;
    const ratio = audioEl.duration ? cueTime / audioEl.duration : 0;
    return {timeRatio: ratio, color: cue.color, name: cue.name};
  });
  drawWaveform();
}

canvas.addEventListener('mousemove', e => {
  const rect = canvas.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const width = canvas.width;
  const hoverCue = markerPositions.find(m => Math.abs(m.timeRatio*width - x) < 5);
  if(hoverCue){
    cueBanner.textContent = hoverCue.name || '(unnamed)';
    cueBanner.style.background = hoverCue.color;
    cueBanner.style.display = 'block';
    cueBanner.style.left = e.pageX+'px';
    cueBanner.style.top = (rect.top + window.scrollY - 30)+'px';
    cueBanner.style.transition = 'all 0.2s ease';
  } else {
    cueBanner.style.display = 'none';
  }
});

canvas.addEventListener('mouseout', ()=>{ cueBanner.style.display = 'none'; });
