'use strict';
function el(tag, text = '', props = {}) {
  const node = document.createElement(tag);
  node.textContent = text;
  Object.assign(node, props);
  return node;
}
document.title = 'Мои задачи';
document.head.append(el('meta', '', {charset:'UTF-8'}), el('meta','',{name:'viewport',content:'width=device-width, initial-scale=1'}), el('link','',{rel:'stylesheet',href:'style.css'}));
const main = el('main','',{className:'app'});
const header = el('header');
header.append(el('p','ЛИЧНЫЙ ПЛАНИРОВЩИК',{className:'eyebrow'}), el('h1','Мои задачи'), el('p','Планируйте дела и следите за прогрессом.'));
const form = el('form','',{className:'panel form'});
const titleInput = el('input','',{id:'task-title',required:true,maxLength:160,placeholder:'Например, подготовить отчёт'});
const dateInput = el('input','',{id:'task-date',type:'date',required:true});
function field(text, input) {
  const label = el('label',text);
  label.append(input);
  return label;
}
const submit = el('button','Добавить',{type:'submit',className:'primary'});
const cancel = el('button','Отмена',{type:'button',hidden:true});
form.append(field('Название задачи',titleInput),field('Срок',dateInput),submit,cancel);
function select(options) {
  const node = el('select');
  for (const [value,label] of options) node.append(el('option',label,{value}));
  return node;
}
const search = el('input','',{type:'search',placeholder:'Найти задачу'});
const dateSearch = el('input','',{type:'date'});
const filter = select([['all','Все'],['active','Активные'],['done','Выполненные']]);
const sort = select([['manual','Вручную'],['asc','Сначала ближайшие'],['desc','Сначала поздние']]);
const controls = el('section','',{className:'panel controls'});
controls.append(field('Поиск',search),field('Дата',dateSearch),field('Статус',filter),field('Порядок',sort));
const section = el('section','',{className:'panel'});
const stats = el('p','',{className:'stats'});
stats.setAttribute('aria-live','polite');
const hint = el('p','Перетаскивайте задачи в ручном режиме.',{className:'hint'});
const list = el('ul','',{className:'tasks'});
const empty = el('p','Задач пока нет.',{className:'empty'});
section.append(el('h2','Список задач'),stats,hint,list,empty);
main.append(header,form,controls,section);
document.body.append(main);
