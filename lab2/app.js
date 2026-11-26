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

const key = 'web-lab2-tasks-v1';
let tasks = [];
try {
  const stored = JSON.parse(localStorage.getItem(key) || '[]');
  if (Array.isArray(stored)) tasks = stored.filter(t => t && typeof t.id === 'string' && typeof t.title === 'string' && typeof t.date === 'string');
} catch (error) { console.warn('Не удалось загрузить задачи', error); }
let editing = null;
function save() {
  try { localStorage.setItem(key, JSON.stringify(tasks)); }
  catch (error) { alert('Не удалось сохранить задачи в браузере.'); }
}
function resetForm() {
  editing = null;
  form.reset();
  submit.textContent = 'Добавить';
  cancel.hidden = true;
}
cancel.addEventListener('click', resetForm);
form.addEventListener('submit', event => {
  event.preventDefault();
  const title = titleInput.value.trim();
  if (!title || !dateInput.value) { titleInput.focus(); return; }
  if (editing !== null) {
    const task = tasks.find(t => t.id === editing);
    if (task) Object.assign(task, {title, date:dateInput.value});
  } else {
    tasks.push({id:globalThis.crypto?.randomUUID?.() || Date.now()+'-'+Math.random(), title, date:dateInput.value, done:false});
  }
  resetForm();
  save();
  render();
  titleInput.focus();
});
function edit(task) {
  editing = task.id;
  titleInput.value = task.title;
  dateInput.value = task.date;
  submit.textContent = 'Сохранить';
  cancel.hidden = false;
  titleInput.focus();
}
function visibleTasks() {
  const query = search.value.trim().toLocaleLowerCase('ru');
  const result = tasks.filter(t =>
    t.title.toLocaleLowerCase('ru').includes(query) &&
    (!dateSearch.value || t.date === dateSearch.value) &&
    (filter.value === 'all' || (filter.value === 'done' ? t.done : !t.done)));
  if (sort.value !== 'manual') result.sort((a,b) => (sort.value === 'asc' ? 1 : -1) * a.date.localeCompare(b.date));
  return result;
}
function button(text, action) {
  const node = el('button',text,{type:'button'});
  node.addEventListener('click',action);
  return node;
}
function render() {
  const visible = visibleTasks();
  list.replaceChildren();
  stats.textContent = 'Всего: '+tasks.length+' · Выполнено: '+tasks.filter(t => t.done).length+' · Показано: '+visible.length;
  empty.hidden = visible.length !== 0;
  empty.textContent = tasks.length ? 'По выбранным условиям ничего не найдено.' : 'Задач пока нет. Добавьте первую!';
  hint.hidden = sort.value !== 'manual';
  for (const task of visible) {
    const row = el('li','',{className:'task'+(task.done?' done':'')});
    row.dataset.id = task.id;
    const check = el('input','',{type:'checkbox',checked:!!task.done});
    check.setAttribute('aria-label','Выполнено: '+task.title);
    check.addEventListener('change',()=>{task.done=check.checked;save();render();});
    const body = el('div','',{className:'task-content'});
    const date = el('time',task.date.split('-').reverse().join('.'));
    date.dateTime = task.date;
    body.append(el('strong',task.title),date);
    const actions = el('div','',{className:'actions'});
    actions.append(button('Изменить',()=>edit(task)),button('Удалить',()=>{
      tasks = tasks.filter(t=>t.id!==task.id);
      if (editing===task.id) resetForm();
      save();render();
    }));
    row.append(check,body,actions);
    list.append(row);
  }
}
for (const control of [search,dateSearch,filter,sort]) control.addEventListener('input',render);
render();
