import { el } from './dom.js';
import {
  getDayTasks, addDayTask, removeDayTask, editDayTask, moveDayTask,
  weekdayName, getWeekday,
} from './model.js';

export function renderEditDay(root, ctx) {
  const dateStr = ctx.currentDate;
  const tasks = getDayTasks(ctx.state, dateStr);

  const header = el('header', { class: 'topbar editbar' }, [
    el('button', { class: 'backbtn', text: '← 完成', onClick: () => ctx.go('main') }),
    el('div', { class: 'edittitle', text: `編輯 ${formatHuman(dateStr)}（${weekdayName(getWeekday(dateStr))}）` }),
  ]);

  const list = el('div', { class: 'editlist' });
  tasks.forEach((t) => {
    const input = el('input', { class: 'edit-input', type: 'text', value: t.title });
    input.value = t.title;
    input.addEventListener('change', () => {
      const v = input.value.trim();
      if (v) { editDayTask(ctx.state, dateStr, t.id, v); ctx.save(); }
    });
    list.appendChild(el('div', { class: 'editrow' }, [
      el('button', { class: 'minibtn', text: '▲', onClick: () => { moveDayTask(ctx.state, dateStr, t.id, -1); ctx.save(); ctx.render(); } }),
      el('button', { class: 'minibtn', text: '▼', onClick: () => { moveDayTask(ctx.state, dateStr, t.id, 1); ctx.save(); ctx.render(); } }),
      input,
      el('button', { class: 'delbtn', text: '刪除', onClick: () => { removeDayTask(ctx.state, dateStr, t.id); ctx.save(); ctx.render(); } }),
    ]));
  });

  const newInput = el('input', { class: 'edit-input', type: 'text', placeholder: '輸入新任務…' });
  const addBtn = el('button', {
    class: 'addbtn', text: '新增任務',
    onClick: () => {
      const title = newInput.value.trim();
      if (title) { addDayTask(ctx.state, dateStr, title); ctx.save(); ctx.render(); }
    },
  });
  const addRow = el('div', { class: 'addrow' }, [newInput, addBtn]);

  const note = el('div', { class: 'note', text: '這裡的修改只影響這一天，不會改到每週範本。' });

  root.appendChild(el('div', { class: 'screen edit' }, [header, list, addRow, note]));
}

function formatHuman(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${y}/${Number(m)}/${Number(d)}`;
}
