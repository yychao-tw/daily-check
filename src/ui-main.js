import { el } from './dom.js';

export function renderMain(root, ctx) {
  root.appendChild(el('div', { class: 'screen' }, [
    el('div', { class: 'edittitle', text: '主畫面 (stub)' }),
    el('button', { class: 'bigbtn edit', text: '編輯這一天', onClick: () => ctx.go('editDay') }),
    el('button', { class: 'bigbtn tmpl', text: '每週範本', onClick: () => ctx.go('template') }),
  ]));
}
