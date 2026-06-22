import { el } from './dom.js';
import {
  getTemplate, addTemplateTask, removeTemplateTask, editTemplateTask, moveTemplateTask,
  weekdayName,
} from './model.js';
import { buildShareUrl } from './share.js';

export function renderTemplate(root, ctx) {
  const w = ctx.selectedWeekday;
  const tasks = getTemplate(ctx.state, w);

  const header = el('header', { class: 'topbar editbar' }, [
    el('button', { class: 'backbtn', text: '← 完成', onClick: () => ctx.go('main') }),
    el('div', { class: 'edittitle', text: '每週範本' }),
  ]);

  const tabs = el('div', { class: 'weektabs' });
  for (let i = 0; i < 7; i++) {
    tabs.appendChild(el('button', {
      class: 'weektab' + (i === w ? ' active' : ''),
      text: weekdayName(i).replace('星期', ''),
      onClick: () => { ctx.setWeekday(i); ctx.render(); },
    }));
  }

  const list = el('div', { class: 'editlist' });
  tasks.forEach((t) => {
    const input = el('input', { class: 'edit-input', type: 'text', value: t.title });
    input.value = t.title;
    input.addEventListener('change', () => {
      const v = input.value.trim();
      if (v) { editTemplateTask(ctx.state, w, t.id, v); ctx.save(); }
    });
    list.appendChild(el('div', { class: 'editrow' }, [
      el('button', { class: 'minibtn', text: '▲', onClick: () => { moveTemplateTask(ctx.state, w, t.id, -1); ctx.save(); ctx.render(); } }),
      el('button', { class: 'minibtn', text: '▼', onClick: () => { moveTemplateTask(ctx.state, w, t.id, 1); ctx.save(); ctx.render(); } }),
      input,
      el('button', { class: 'delbtn', text: '刪除', onClick: () => { removeTemplateTask(ctx.state, w, t.id); ctx.save(); ctx.render(); } }),
    ]));
  });

  const newInput = el('input', { class: 'edit-input', type: 'text', placeholder: '輸入新任務…' });
  const addBtn = el('button', {
    class: 'addbtn', text: '新增任務',
    onClick: () => {
      const title = newInput.value.trim();
      if (title) { addTemplateTask(ctx.state, w, title); ctx.save(); ctx.render(); }
    },
  });
  const addRow = el('div', { class: 'addrow' }, [newInput, addBtn]);

  const note = el('div', { class: 'note', text: '修改範本只影響「之後尚未被單獨編輯過」的日子。' });

  const shareBtn = el('button', {
    class: 'sharebtn', text: '匯出範本連結（傳到 iPad）',
    onClick: () => exportTemplatesLink(ctx),
  });
  const shareNote = el('div', { class: 'note', text: '在電腦填好範本後，按上面按鈕複製連結，用 LINE 或 Email 傳到 iPad，點開連結即可匯入（只會覆蓋每週範本，打勾紀錄保留）。' });

  root.appendChild(el('div', { class: 'screen template' }, [header, tabs, list, addRow, note, shareBtn, shareNote]));
}

async function exportTemplatesLink(ctx) {
  const url = buildShareUrl(ctx.state.templates, location.href);
  let copied = false;
  try {
    if (navigator.clipboard && navigator.clipboard.writeText) {
      await navigator.clipboard.writeText(url);
      copied = true;
    }
  } catch (_e) {
    copied = false;
  }
  if (copied) {
    window.alert('已複製範本連結！用 LINE 或 Email 傳到 iPad，點開連結即可匯入。');
  } else {
    window.prompt('複製這段範本連結，傳到 iPad 後用 Safari 開啟：', url);
  }
}
