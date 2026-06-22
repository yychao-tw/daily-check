import { el } from './dom.js';

export function renderEditDay(root, ctx) {
  root.appendChild(el('div', { class: 'screen' }, [
    el('div', { class: 'edittitle', text: '編輯這一天 (stub)' }),
    el('button', { class: 'backbtn', text: '← 完成', onClick: () => ctx.go('main') }),
  ]));
}
