import { el } from './dom.js';
import {
  getDayTasks, toggleTask, countDone, isAllDone,
  weekdayName, getWeekday, addDays, todayStr,
} from './model.js';

export function renderMain(root, ctx) {
  const dateStr = ctx.currentDate;
  const tasks = getDayTasks(ctx.state, dateStr);
  const { done, total } = countDone(tasks);

  const header = el('header', { class: 'topbar' }, [
    el('button', { class: 'navbtn', text: '◀', onClick: () => { ctx.setDate(addDays(dateStr, -1)); ctx.render(); } }),
    el('div', { class: 'datebox' }, [
      el('div', { class: 'date', text: formatHuman(dateStr) }),
      el('div', { class: 'weekday', text: weekdayName(getWeekday(dateStr)) }),
    ]),
    el('button', { class: 'navbtn', text: '▶', onClick: () => { ctx.setDate(addDays(dateStr, 1)); ctx.render(); } }),
  ]);

  const todayBtn = el('button', { class: 'todaybtn', text: '回到今天', onClick: () => { ctx.setDate(todayStr()); ctx.render(); } });

  const scoreboard = el('div', { class: 'scoreboard' }, [
    el('span', { class: 'score-label', text: '完成' }),
    el('span', { class: 'score-num', text: `${done} / ${total}` }),
  ]);

  const diamond = buildDiamond(done, total);

  const list = el('div', { class: 'tasklist' });
  if (tasks.length === 0) {
    list.appendChild(el('div', { class: 'empty', text: '今天還沒有任務，按下方「編輯這一天」新增吧！' }));
  } else {
    for (const t of tasks) {
      list.appendChild(taskCard(t, () => {
        const wasAllDone = isAllDone(getDayTasks(ctx.state, dateStr));
        toggleTask(ctx.state, dateStr, t.id);
        ctx.save();
        const nowAllDone = isAllDone(getDayTasks(ctx.state, dateStr));
        ctx.render();
        if (!wasAllDone && nowAllDone) showHomeRun();
      }));
    }
  }

  const footer = el('footer', { class: 'footer' }, [
    el('button', { class: 'bigbtn edit', text: '編輯這一天', onClick: () => ctx.go('editDay') }),
    el('button', { class: 'bigbtn tmpl', text: '每週範本', onClick: () => { ctx.setWeekday(getWeekday(ctx.currentDate)); ctx.go('template'); } }),
  ]);

  root.appendChild(el('div', { class: 'screen main' }, [header, todayBtn, scoreboard, diamond, list, footer]));
}

function taskCard(task, onToggle) {
  const ball = el('div', { class: 'ball' + (task.done ? ' done' : '') });
  if (task.done) ball.appendChild(el('span', { class: 'safe', text: 'SAFE' }));
  return el('div', { class: 'card' + (task.done ? ' done' : ''), onClick: onToggle }, [
    ball,
    el('div', { class: 'title', text: task.title }),
  ]);
}

function buildDiamond(done, total) {
  const bases = 4;
  const reached = total === 0 ? 0 : Math.round((done / total) * bases);
  const wrap = el('div', { class: 'diamond' });
  for (let i = 1; i <= bases; i++) {
    wrap.appendChild(el('div', { class: 'base base' + i + (i <= reached ? ' lit' : '') }));
  }
  return wrap;
}

function formatHuman(dateStr) {
  const [y, m, d] = dateStr.split('-');
  return `${y} 年 ${Number(m)} 月 ${Number(d)} 日`;
}

function showHomeRun() {
  const overlay = el('div', { class: 'homerun-overlay' }, [
    el('div', { class: 'homerun-ball' }),
    el('div', { class: 'homerun-text', text: '全壘打！今天全部完成！' }),
  ]);
  document.body.appendChild(overlay);
  setTimeout(() => overlay.remove(), 2600);
}
