const playlistEl = document.getElementById('playlist');
const newPageBtn = document.getElementById('newPageBtn');

newPageBtn.addEventListener('click', ()=> addPage("Page "+(pages.length+1)));

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
