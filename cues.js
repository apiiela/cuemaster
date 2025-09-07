const cueTableBody = document.getElementById('cueTableBody');
let currentPage = 0; // Will be updated from pages.js

function loadPageCues(page) {
  cueTableBody.innerHTML = '';
  if (!page) return;
  page.cues.forEach((cue, j) => {
    const tr = document.createElement('tr');
    tr.innerHTML = `
      <td>${cue.time}</td>
      <td><input value="${cue.name || ''}" data-field="name" data-i="${j}"/></td>
      <td><input class="notes" value="${cue.note || ''}" data-field="note" data-i="${j}"/></td>
      <td><input type="color" value="${cue.color || '#5b8cff'}" data-field="color" data-i="${j}"/></td>
      <td><button data-i="${j}" class="del">Delete</button></td>`;

    tr.querySelectorAll('input').forEach(inp => {
      inp.addEventListener('input', () => {
        const field = inp.dataset.field;
        page.cues[j][field] = inp.value;
      });
    });

    tr.querySelector('.del').addEventListener('click', () => {
      page.cues.splice(j, 1);
      loadPageCues(page);
    });

    cueTableBody.appendChild(tr);
  });
}

// Add cue button
const addCueBtn = document.getElementById('addCueBtn');
addCueBtn.addEventListener('click', () => {
  if (!pages[currentPage]) return;
  const t = audioEl.currentTime || 0;
  const ms = (t % 1).toFixed(3).substring(2);
  const s = ('0' + Math.floor(t % 60)).slice(-2);
  const m = ('0' + Math.floor(t / 60)).slice(-2);
  const timeStr = `${m}:${s}.${ms}`;
  pages[currentPage].cues.push({ time: timeStr, name: '', note: '', color: '#5b8cff' });
  loadPageCues(pages[currentPage]);
});
