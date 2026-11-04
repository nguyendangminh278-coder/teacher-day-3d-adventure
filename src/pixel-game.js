import { CLASS_WISHES, TREE_WISHES, STAGES, DIALOGUES } from './config.js';
import { drawFinePixelScene, drawOverworldMap } from './fine-pixel-art.js';

// A real outdoor overworld with three explorable destinations.
// School -> classroom wishes -> car trip -> family home -> wish tree.
// Scenic map is continuous; indoor locations are separate full-screen scenes.
const canvas = document.getElementById('game');
const ctx = canvas.getContext('2d', { alpha: false });
const ui = {
  action: document.getElementById('actionBtn'),
  actionLabel: document.getElementById('actionLabel'),
  stageNumber: document.getElementById('stageNumber'),
  objectiveTitle: document.getElementById('objectiveTitle'),
  objectiveText: document.getElementById('objectiveText'),
  dialogue: document.getElementById('dialogue'),
  dialogueName: document.getElementById('dialogueName'),
  dialogueText: document.getElementById('dialogueText'),
  classroomPanel: document.getElementById('classroomPanel'),
  classWishes: document.getElementById('classWishes'),
  dismissClass: document.getElementById('dismissClass'),
  finalPanel: document.getElementById('finalPanel'),
  treeWish: document.getElementById('treeWish'),
  replay: document.getElementById('replayBtn'),
  loading: document.getElementById('loading'),
  assetStatus: document.getElementById('assetStatus'),
  mapHotspots: document.getElementById('mapHotspots'),
  mapHint: document.getElementById('mapHint'),
  mapReturn: document.getElementById('mapReturn'),
  mapFade: document.getElementById('mapFade')
};

const places = {
  school: {x:228, dy:18, label:'Trường học'},
  car: {x:434, dy:55, label:'Đi bằng xe'},
  home: {x:606, dy:23, label:'Nhà của mẹ'}
};
const placeButtons = Object.fromEntries(
  Array.from(document.querySelectorAll('[data-place]')).map(button => [button.dataset.place, button])
);
const objectives = {
  0:'Chọn Trường học trên bản đồ để bắt đầu hành trình.',
  1:'Mẹ đang băng qua con đường hoa nhỏ trong khu rừng.',
  2:'Đi theo con đường lát đá để đến ngôi trường thân thương.',
  3:'Đã đến trường. Bấm “Vào lớp học” để gặp các học trò.',
  4:'Cả lớp chuẩn bị 25 tấm thiệp nhỏ dành tặng cô.',
  5:'Trở về bản đồ, chọn điểm Đi bằng xe để về nhà.',
  6:'Bước vào nhà và nghe lời chúc của bố.',
  7:'Đi lên tầng hai để nhận lời chúc của anh trai.',
  8:'Em trai cũng có một lời chúc gửi đến mẹ.',
  9:'Chạm vào từng bông hoa trên cây để mở lời chúc.'
};
const controls = {
  school:'ĐẾN TRƯỜNG HỌC',
  car:'LÊN XE VỀ NHÀ',
  home:'BƯỚC VÀO NHÀ'
};

let W = 768;
let H = 432;
let stage = 0;
let view = 'map';             // "map" or "scene"
let mapPhase = 'school';      // which location is unlocked next
let journey = null;
let changingScene = false;
let selectedBloom = -1;
let bloomHits = [];
let lastFrame = 0;
let dialogueTimer = 0;
let finalTimer = 0;
let teacher = {x:383, y:0, walking:false, visible:true};
let movingCar = null;
let hasSeenClassroom = false;
let homeProgress = 6;
const reduceMotion = Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);

CLASS_WISHES.forEach((wish, i) => {
  const card = document.createElement('div');
  card.className = 'wish-card';
  const number = document.createElement('span');
  number.className = 'wish-number';
  number.textContent = String(i + 1).padStart(2, '0');
  const text = document.createElement('span');
  text.textContent = wish;
  card.append(number, text);
  ui.classWishes.appendChild(card);
});

function ground() { return Math.round(H * .72); }
function point(place) {
  const p = places[place];
  return {x:p.x, y:ground() + p.dy};
}
function resize() {
  const previousGround = ground();
  W = 768;
  H = Math.max(432, Math.min(1600, Math.round(W * innerHeight / Math.max(1,innerWidth))));
  canvas.width = W;
  canvas.height = H;
  ctx.imageSmoothingEnabled = false;
  const offset = ground()-previousGround;
  teacher.y += offset;
  if(movingCar) movingCar.y += offset;
  if(journey) journey.path.forEach(p => { p.y += offset; });
  placeHotspots();
}
function placeHotspots() {
  for (const [key,button] of Object.entries(placeButtons)) {
    const pt = point(key);
    button.style.left = (pt.x/W*100).toFixed(3)+'%';
    button.style.top = (Math.max(0,pt.y-19)/H*100).toFixed(3)+'%';
  }
}
window.addEventListener('resize',resize);
resize();
teacher = {x:382,y:ground()+53,walking:false,visible:true};

function showDialogue(d,ms=6200) {
  clearTimeout(dialogueTimer);
  if(!d) {ui.dialogue.classList.add('hidden'); return;}
  ui.dialogueName.textContent=d.name;
  ui.dialogueText.textContent=d.text;
  ui.dialogue.classList.remove('hidden');
  dialogueTimer=setTimeout(()=>ui.dialogue.classList.add('hidden'),ms);
}
function busy() { return Boolean(journey || changingScene); }
function setStage(n) {
  stage=n;
  window.__finePixelArrival=performance.now();
  ui.stageNumber.textContent=String(n+1);
  ui.objectiveTitle.textContent=STAGES[n].title;
  ui.objectiveText.textContent=objectives[n];
  if(n===9) {
    clearTimeout(finalTimer);
    document.body.classList.add('finale-ui');
    finalTimer=setTimeout(()=>ui.finalPanel.classList.remove('hidden'),reduceMotion?50:1200);
    showDialogue(DIALOGUES.finale,5000);
  }else{
    document.body.classList.remove('finale-ui');
    ui.finalPanel.classList.add('hidden');
  }
  refreshUI();
}
function refreshUI() {
  const onMap = view==='map';
  ui.mapHotspots.classList.toggle('hidden',!onMap);
  ui.mapHint.classList.toggle('hidden',!onMap);
  ui.mapReturn.classList.toggle('hidden',onMap||stage===9);
  const blocked=busy();
  if(onMap && stage===5){
    ui.objectiveText.textContent = mapPhase==='home'
      ? 'Xe đã tới nơi. Chọn Nhà của mẹ trên bản đồ để gặp gia đình.'
      : 'Tan lớp rồi! Chạm điểm Đi bằng xe để trở về nhà.';
  }
  Object.entries(placeButtons).forEach(([key,button])=>{
    const active=onMap && key===mapPhase && !blocked;
    button.disabled=!active;
    button.classList.toggle('is-active',active);
    button.classList.toggle('is-locked',onMap && key!==mapPhase);
    button.setAttribute('aria-label',active
      ? 'Đi đến '+places[key].label
      : places[key].label+' — chưa đến lượt');
  });
  if(view==='scene' && stage===9) {
    ui.action.classList.add('hidden');
  }else if(view==='scene' && stage===4 && !ui.classroomPanel.classList.contains('hidden')) {
    ui.action.classList.add('hidden');
  }else{
    ui.action.classList.remove('hidden');
  }
  ui.action.disabled=blocked;
  let label;
  if(onMap) {
    label=mapPhase==='home' ? controls.home : controls[mapPhase];
    if(journey) label=journey.vehicle ? 'ĐANG LÁI XE…':'MẸ ĐANG ĐI…';
  }else{
    label=stage===3?'VÀO LỚP HỌC'
      :stage===4?'ĐỌC 25 LỜI CHÚC'
      :stage===6?'LÊN GẶP ANH TRAI'
      :stage===7?'ĐẾN GẶP EM TRAI'
      :stage===8?'LÊN CÂY ĐIỀU ƯỚC':'TIẾP TỤC';
  }
  ui.actionLabel.textContent=label;
  ui.mapHint.textContent=onMap
    ? '✦ Hãy chọn '+places[mapPhase].label+' · Nhấn phím → hoặc nút nhiệm vụ'
    : '';
}
function enterScene(n,dialogue) {
  if(changingScene)return;
  changingScene=true;
  refreshUI();
  ui.mapFade.classList.add('on');
  const delay=reduceMotion?0:330;
  setTimeout(()=>{
    view='scene';
    ui.mapFade.classList.remove('on');
    changingScene=false;
    setStage(n);
    if(dialogue) showDialogue(dialogue);
  },delay);
}
function returnToMap(newPhase) {
  if(changingScene)return;
  changingScene=true;
  refreshUI();
  ui.mapFade.classList.add('on');
  setTimeout(()=>{
    view='map';
    mapPhase=newPhase;
    teacher.visible=true;
    teacher.walking=false;
    movingCar=null;
    ui.classroomPanel.classList.add('hidden');
    ui.mapFade.classList.remove('on');
    changingScene=false;
    refreshUI();
  },reduceMotion?0:300);
}
function interpolatePath(path,p) {
  // Distance-weighted interpolation keeps walking speed consistent around bends.
  const lengths=[];
  let total=0;
  for(let i=1;i<path.length;i++){
    const length=Math.hypot(path[i].x-path[i-1].x,path[i].y-path[i-1].y);
    lengths.push(length); total+=length;
  }
  let remaining=total*Math.max(0,Math.min(1,p));
  for(let i=0;i<lengths.length;i++){
    if(remaining<=lengths[i] || i===lengths.length-1){
      const t=lengths[i]===0?1:Math.min(1,remaining/lengths[i]);
      return {
        x:path[i].x+(path[i+1].x-path[i].x)*t,
        y:path[i].y+(path[i+1].y-path[i].y)*t
      };
    }
    remaining-=lengths[i];
  }
  return path[path.length-1];
}
function move(path,duration,vehicle,onDone) {
  if(busy())return;
  journey={path:path.map(p=>({...p})),duration:reduceMotion?150:duration,
    vehicle:Boolean(vehicle),started:performance.now(),onDone,halfAnnounced:false};
  teacher.walking=!vehicle;
  teacher.visible=!vehicle;
  movingCar=vehicle?{...path[0]}:null;
  ui.dialogue.classList.add('hidden');
  refreshUI();
}
function advanceJourney(now) {
  const j=journey;
  if(!j)return;
  const p=Math.max(0,Math.min(1,(now-j.started)/j.duration));
  const pos=interpolatePath(j.path,p);
  if(j.vehicle)movingCar=pos;
  else {teacher.x=pos.x;teacher.y=pos.y;teacher.walking=p<1;teacher.visible=true;}
  if(!j.vehicle&&!j.halfAnnounced&&stage===1&&p>.48){
    j.halfAnnounced=true;
    setStage(2);
  }
  if(p>=1){
    journey=null;
    teacher.walking=false;
    const callback=j.onDone;
    refreshUI();
    callback?.();
  }
}
function walkToSchool() {
  if(mapPhase!=='school'||busy())return;
  setStage(1);
  const y=ground();
  const start={x:teacher.x,y:teacher.y};
  move([start,{x:357,y:y+43},{x:307,y:y+23},point('school')],reduceMotion?160:2750,false,()=>{
    enterScene(3,DIALOGUES.school);
  });
  showDialogue(DIALOGUES.garden,2700);
}
function rideHome() {
  if(mapPhase!=='car'||busy())return;
  setStage(5);
  const y=ground();
  move([{x:teacher.x,y:teacher.y},{x:320,y:y+36},{x:399,y:y+54},point('car')],1250,false,()=>{
    teacher.visible=false;
    move([point('car'),{x:488,y:y+44},{x:524,y:y+26},{x:566,y:y+27},point('home')],reduceMotion?180:3000,true,()=>{
      teacher.x=point('home').x;
      teacher.y=point('home').y;
      teacher.visible=true;
      movingCar=null;
      mapPhase='home';
      showDialogue(DIALOGUES.home,4700);
      refreshUI();
    });
  });
}
function enterHome() {
  if(mapPhase!=='home'||busy())return;
  homeProgress=Math.max(6,Math.min(homeProgress,8));
  enterScene(homeProgress,homeProgress===6?DIALOGUES.father:
    homeProgress===7?DIALOGUES.olderBrother:DIALOGUES.youngerBrother);
}
function goToPlace(name) {
  if(view!=='map'||busy()||name!==mapPhase)return;
  if(name==='school')walkToSchool();
  else if(name==='car')rideHome();
  else if(name==='home')enterHome();
}
Object.entries(placeButtons).forEach(([name,button])=>button.addEventListener('click',()=>goToPlace(name)));
function action(){
  if(busy())return;
  if(view==='map'){goToPlace(mapPhase);return;}
  if(stage===3){
    enterScene(4,DIALOGUES.classroom);
  }else if(stage===4){
    ui.classroomPanel.classList.remove('hidden');
    showDialogue(DIALOGUES.classroom);
    refreshUI();
  }else if(stage===6){
    homeProgress=7;enterScene(7,DIALOGUES.olderBrother);
  }else if(stage===7){
    homeProgress=8;enterScene(8,DIALOGUES.youngerBrother);
  }else if(stage===8){
    enterScene(9);
  }
}
ui.action.addEventListener('click',action);
ui.dismissClass.addEventListener('click',()=>{
  hasSeenClassroom=true;
  ui.classroomPanel.classList.add('hidden');
  teacher.x=point('school').x;
  teacher.y=point('school').y;
  teacher.visible=true;
  setStage(5);
  showDialogue(DIALOGUES.afterClass,4100);
  returnToMap('car');
});
ui.mapReturn.addEventListener('click',()=>{
  if(view==='map'||busy())return;
  if(stage===3||stage===4) {
    teacher.x=point('school').x;teacher.y=point('school').y;
    returnToMap(hasSeenClassroom?'car':'school');
  } else {
    teacher.x=point('home').x;teacher.y=point('home').y;
    returnToMap('home');
  }
});
ui.replay.addEventListener('click',()=>{
  clearTimeout(finalTimer);
  ui.classroomPanel.classList.add('hidden');
  ui.finalPanel.classList.add('hidden');
  selectedBloom=-1;
  bloomHits=[];
  journey=null;
  changingScene=false;
  hasSeenClassroom=false;
  homeProgress=6;
  movingCar=null;
  mapPhase='school';
  view='map';
  teacher={x:382,y:ground()+53,walking:false,visible:true};
  ui.mapFade.classList.remove('on');
  setStage(0);
  showDialogue(DIALOGUES.intro,7200);
});
canvas.addEventListener('pointerdown',e=>{
  if(busy())return;
  const bounds=canvas.getBoundingClientRect();
  const x=(e.clientX-bounds.left)*W/Math.max(1,bounds.width);
  const y=(e.clientY-bounds.top)*H/Math.max(1,bounds.height);
  if(view==='map'){
    const p=point(mapPhase);
    if(Math.hypot(x-p.x,y-p.y)<72)goToPlace(mapPhase);
    return;
  }
  if(stage!==9)return;
  let hit=null,closest=28*28;
  for(const flower of bloomHits){
    const distance=(flower.x-x)**2+(flower.y-y)**2;
    if(distance<closest){closest=distance;hit=flower;}
  }
  if(hit){
    selectedBloom=hit.index;
    ui.treeWish.textContent='✿ '+TREE_WISHES[selectedBloom];
  }
});
window.addEventListener('keydown',e=>{
  if(e.key==='Escape'&&!ui.classroomPanel.classList.contains('hidden'))return;
  if((e.key==='ArrowRight'||e.key==='Enter')&&document.activeElement!==ui.mapReturn&&
     ui.classroomPanel.classList.contains('hidden')&&!busy()){
    e.preventDefault();action();
  }
  if((e.key==='m'||e.key==='M')&&view==='scene'&&stage!==9&&!busy())ui.mapReturn.click();
});
function loop(now) {
  requestAnimationFrame(loop);
  if(now-lastFrame<30)return;
  lastFrame=now;
  const t=reduceMotion?0:now*.001;
  advanceJourney(now);
  if(view==='map'){
    drawOverworldMap(ctx,W,H,t,teacher,movingCar,reduceMotion);
  }else{
    bloomHits=drawFinePixelScene(ctx,W,H,stage,t,selectedBloom,TREE_WISHES.length,reduceMotion);
  }
}

ui.assetStatus.textContent='BẢN ĐỒ RPG · TRƯỜNG → XE → NHÀ · CANVAS 2D';
ui.loading.classList.add('done');
window.__APP_READY__=true;
setStage(0);
showDialogue(DIALOGUES.intro,7500);
requestAnimationFrame(loop);
