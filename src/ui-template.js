import { el } from './dom.js';

export function renderTemplate(root, ctx) {
  root.appendChild(el('div', { class: 'screen' }, [
    el('div', { class: 'edittitle', text: '每週範本 (stub)' }),
    el('button', { class: 'backbtn', text: '← 完成', onClick: () => ctx.go('main') }),
  ]));
}
