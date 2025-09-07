const addCueBtn = document.getElementById('addCueBtn');
const cueTableBody = document.getElementById('cueTableBody');

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

// Add cue
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
