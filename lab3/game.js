'use strict';
const make=(tag,text='',props={})=>{const n=document.createElement(tag);n.textContent=text;Object.assign(n,props);return n};
const root=make('main','',{className:'app'});
const top=make('header','',{className:'topline'});
const heading=make('h1','2048');
const topActions=make('div','',{className:'top-actions'});
const leadersBtn=make('button','Таблица лидеров',{className:'btn light',type:'button'});
const restartBtn=make('button','Новая игра',{className:'btn',type:'button'});
topActions.append(leadersBtn,restartBtn);top.append(heading,topActions);
const intro=make('section','',{className:'intro'});
intro.append(make('p','Соединяйте одинаковые числа и набирайте очки.'));
const scores=make('div','',{className:'scores'});
const scoreBox=make('div','',{className:'score-box'}),bestBox=make('div','',{className:'score-box'});
const scoreValue=make('strong','0'),bestValue=make('strong','0');
scoreBox.append(make('span','Счёт'),scoreValue);bestBox.append(make('span','Лучший'),bestValue);scores.append(scoreBox,bestBox);intro.append(scores);
const boardWrap=make('section','',{className:'board-wrap'});
boardWrap.setAttribute('aria-label','Игровое поле 2048');
const board=make('div','',{className:'board'});
const tilesLayer=make('div','',{className:'tiles'});
for(let i=0;i<16;i++)board.append(make('div','',{className:'cell','aria-hidden':'true'}));
board.append(tilesLayer);boardWrap.append(board);
const mobile=make('nav','',{className:'mobile-controls','aria-label':'Управление игрой'});
for(const [dir,txt,cls] of [['up','↑','up'],['left','←','left'],['down','↓','down'],['right','→','right']]){
 const b=make('button',txt,{type:'button',className:cls});b.setAttribute('aria-label',({up:'Вверх',down:'Вниз',left:'Влево',right:'Вправо'})[dir]);b.addEventListener('click',()=>move(dir));mobile.append(b);
}
const help=make('p','Управление: стрелки на клавиатуре или кнопки на экране. Объединяйте одинаковые плитки. Можно отменить последний ход.',{className:'help'});
root.append(top,intro,boardWrap,mobile,help);document.body.append(root);
const overlay=make('div','',{className:'overlay hidden'});
const dialog=make('section','',{className:'dialog','aria-modal':'true',role:'dialog','aria-labelledby':'dialog-title'});
overlay.append(dialog);document.body.append(overlay);
const STORAGE='web-lab3-2048-v1',LEADERS='web-lab3-2048-leaders-v1';
let state={grid:Array(16).fill(0),score:0,best:0,over:false,screen:'game'};
let previous=null,leaders=[],hasSavedGame=false,savedPrevious=null;
try{const s=JSON.parse(localStorage.getItem(STORAGE)||'null');if(s&&Array.isArray(s.grid)&&s.grid.length===16&&s.grid.every(n=>Number.isInteger(n)&&n>=0)){state={...state,...s,screen:'game'};state.over=!!s.over;hasSavedGame=true;savedPrevious=s.previous||null;}}catch(e){console.warn('Не удалось загрузить игру',e)}
try{const l=JSON.parse(localStorage.getItem(LEADERS)||'[]');if(Array.isArray(l))leaders=l.filter(x=>x&&typeof x.name==='string'&&Number.isFinite(x.score)).slice(0,10)}catch(e){console.warn('Не удалось загрузить рекорды',e)}
function persist(){try{localStorage.setItem(STORAGE,JSON.stringify({grid:state.grid,score:state.score,best:state.best,over:state.over,previous}))}catch(e){console.warn('Не удалось сохранить игру',e)}}
function saveLeaders(){try{localStorage.setItem(LEADERS,JSON.stringify(leaders))}catch(e){alert('Не удалось сохранить таблицу рекордов в браузере.')}}
function randomTile(){const free=[];state.grid.forEach((v,i)=>{if(!v)free.push(i)});if(!free.length)return;const index=free[Math.floor(Math.random()*free.length)];state.grid[index]=Math.random()<.9?2:4}
function startGame(){state.grid=Array(16).fill(0);state.score=0;state.over=false;state.screen='game';previous=null;const count=1+Math.floor(Math.random()*3);for(let i=0;i<count;i++)randomTile();persist();drawAnimated()}
function snapshot(){return {grid:state.grid.slice(),score:state.score,best:state.best,over:state.over}}
function drawAnimated(){if(document.startViewTransition)document.startViewTransition(()=>render());else render()}
function render(){
 scoreValue.textContent=state.score;bestValue.textContent=state.best;
 tilesLayer.replaceChildren();
 state.grid.forEach((value,index)=>{if(!value)return;const tile=make('div',String(value),{className:'tile '+(value<=64?'v'+value:value<=512?'v'+value:value===1024?'v1024':value===2048?'v2048':'vhigh')});tile.style.gridColumn=String(index%4+1);tile.style.gridRow=String(Math.floor(index/4)+1);tile.setAttribute('aria-label',String(value));tilesLayer.append(tile)});
 mobile.classList.toggle('hidden',state.screen!=='game'||state.over);
 overlay.classList.toggle('hidden',state.screen==='game'&&!state.over);
 if(state.over&&state.screen==='game')showGameOver();
}
function collapse(line){
 const values=line.filter(Boolean);let out=[],gained=0;
 for(const value of values){out.push(value);while(out.length>1&&out[out.length-1]===out[out.length-2]){const merged=out.pop()*2;out.pop();out.push(merged);gained+=merged}}
 while(out.length<4)out.push(0);
 return {line:out,gained};
}
function getLines(grid,dir){
 const lines=[];
 for(let i=0;i<4;i++){const indexes=[];for(let j=0;j<4;j++){if(dir==='left')indexes.push(i*4+j);if(dir==='right')indexes.push(i*4+(3-j));if(dir==='up')indexes.push(j*4+i);if(dir==='down')indexes.push((3-j)*4+i)}lines.push(indexes)}
 return lines;
}
function hasMoves(){if(state.grid.some(v=>v===0))return true;for(let r=0;r<4;r++)for(let c=0;c<4;c++){const i=r*4+c;if(c<3&&state.grid[i]===state.grid[i+1])return true;if(r<3&&state.grid[i]===state.grid[i+4])return true}return false}
function move(dir){
 if(state.screen!=='game'||state.over)return;
 const next=state.grid.slice();let gained=0;
 for(const indexes of getLines(next,dir)){const result=collapse(indexes.map(i=>next[i]));gained+=result.gained;indexes.forEach((index,j)=>next[index]=result.line[j])}
 if(next.every((v,i)=>v===state.grid[i]))return;
 previous=snapshot();state.grid=next;state.score+=gained;state.best=Math.max(state.best,state.score);
 const spawns=1+Math.floor(Math.random()*2);for(let i=0;i<spawns;i++)randomTile();
 if(!hasMoves()){state.over=true;persist();drawAnimated();return}
 persist();drawAnimated();
}
function undo(){
 if(!previous||state.over||state.screen!=='game')return;
 state.grid=previous.grid;state.score=previous.score;state.best=Math.max(state.best,previous.best);state.over=false;previous=null;persist();render();
}
function closeDialog(){state.screen='game';render()}
function showGameOver(){
 dialog.replaceChildren(make('h2','Игра окончена',{id:'dialog-title'}),make('p','Ходов больше нет. Ваш результат: '+state.score+' очков.'));
 const form=make('form','',{className:'record-form'});
 const name=make('input','',{type:'text',maxLength:24,required:true,placeholder:'Ваше имя',autocomplete:'name'});
 name.setAttribute('aria-label','Имя пользователя');
 const save=make('button','Сохранить результат',{className:'btn',type:'submit'});
 form.append(name,save);
 form.addEventListener('submit',e=>{e.preventDefault();const value=name.value.trim();if(!value){name.focus();return}leaders.push({name:value,score:state.score,date:new Date().toISOString()});leaders.sort((a,b)=>b.score-a.score||a.date.localeCompare(b.date));leaders=leaders.slice(0,10);saveLeaders();showSaved();});
 const actions=make('div','',{className:'dialog-actions'});actions.append(restartButton.cloneNode(true));actions.lastChild.addEventListener('click',startGame);
 dialog.append(form,actions);
}
function showSaved(){dialog.replaceChildren(make('h2','Ваш рекорд сохранён',{id:'dialog-title'}),make('p','Результат '+state.score+' очков добавлен в таблицу лидеров.'));const actions=make('div','',{className:'dialog-actions'});const view=make('button','Посмотреть лидеров',{className:'btn light',type:'button'});view.addEventListener('click',showLeaders);const again=make('button','Начать заново',{className:'btn',type:'button'});again.addEventListener('click',startGame);actions.append(view,again);dialog.append(actions)}
function showLeaders(){
 state.screen='leaders';mobile.classList.add('hidden');overlay.classList.remove('hidden');dialog.replaceChildren(make('h2','Таблица лидеров',{id:'dialog-title'}));
 if(!leaders.length)dialog.append(make('p','Пока нет сохранённых результатов.',{className:'empty-leaders'}));
 else{const table=make('table','',{className:'leader-list'}),thead=make('thead'),tr=make('tr');for(const title of ['№','Имя','Очки','Дата'])tr.append(make('th',title));thead.append(tr);const tbody=make('tbody');leaders.forEach((item,i)=>{const row=make('tr');row.append(make('td',String(i+1)),make('td',item.name),make('td',String(item.score)),make('td',new Date(item.date).toLocaleDateString('ru-RU')));tbody.append(row)});table.append(thead,tbody);dialog.append(table)}
 const actions=make('div','',{className:'dialog-actions'});const back=make('button','Вернуться в игру',{className:'btn',type:'button'});back.addEventListener('click',closeDialog);actions.append(back);dialog.append(actions);
}
function onKey(e){const map={ArrowUp:'up',ArrowDown:'down',ArrowLeft:'left',ArrowRight:'right'};if(map[e.key]){e.preventDefault();move(map[e.key])}else if((e.ctrlKey||e.metaKey)&&e.key.toLowerCase()==='z'){e.preventDefault();undo()}}
document.addEventListener('keydown',onKey);
let touchStart=null;
boardWrap.addEventListener('touchstart',e=>{const t=e.changedTouches[0];touchStart={x:t.clientX,y:t.clientY}},{passive:true});
boardWrap.addEventListener('touchend',e=>{if(!touchStart)return;const t=e.changedTouches[0],dx=t.clientX-touchStart.x,dy=t.clientY-touchStart.y;touchStart=null;if(Math.max(Math.abs(dx),Math.abs(dy))<28)return;move(Math.abs(dx)>Math.abs(dy)?(dx>0?'right':'left'):(dy>0?'down':'up'))},{passive:true});
leadersBtn.addEventListener('click',showLeaders);
restartBtn.addEventListener('click',startGame);
const undoBtn=make('button','Отменить ход',{className:'btn light',type:'button'});undoBtn.addEventListener('click',undo);topActions.prepend(undoBtn);
if(hasSavedGame){previous=savedPrevious&&Array.isArray(savedPrevious.grid)&&savedPrevious.grid.length===16?savedPrevious:null;render()}else startGame();
