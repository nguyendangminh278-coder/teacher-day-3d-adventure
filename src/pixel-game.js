import { CLASS_WISHES, TREE_WISHES, STAGES, DIALOGUES } from './config.js';
import { drawFinePixelScene } from './fine-pixel-art.js';

// A complete, dependency-free 2D pixel-art edition of the 20/11 journey.
// Everything is drawn in low resolution; there are no 3D models, shaders or CDN assets.
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
  assetStatus: document.getElementById('assetStatus')
};

const descriptions = [
  'Bước vào câu chuyện 20/11 được vẽ hoàn toàn bằng pixel.',
  'Dạo qua khu rừng hoa, ngôi nhà gỗ và cối xay gió phong cách RPG.',
  'Theo con đường pastel để đến trường của mẹ.',
  'Ngôi trường thân thương đã chờ sẵn từ sáng sớm.',
  'Cả lớp có 25 lời chúc nhỏ muốn gửi đến cô.',
  'Một chuyến xe pixel đưa mẹ trở về nhà.',
  'Bố đang đợi mẹ trong phòng khách ấm áp.',
  'Anh trai có một điều muốn nói với mẹ.',
  'Em trai cũng muốn gửi tặng mẹ lời chúc.',
  'Chạm vào những bông hoa trên cây để đọc lời chúc dành cho mẹ.'
];

let W = 768;
let H = 432;
let stage = 0;
let transition = null;
let busy = false;
let dialogueTimer = 0;
let arrivalTime = performance.now();
let selectedBloom = -1;
let bloomHits = [];
let lastFrame = 0;
const reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

CLASS_WISHES.forEach(function(wish, i) {
  const card = document.createElement('div');
  card.className = 'wish-card';
  const num = document.createElement('span');
  num.className = 'wish-number';
  num.textContent = String(i + 1).padStart(2, '0');
  const text = document.createElement('span');
  text.textContent = wish;
  card.append(num, text);
  ui.classWishes.appendChild(card);
});

function resize() {
  // Native small-pixel 768px canvas; keep 1–3px foliage and masonry details crisp.
  W = 768;
  H = Math.max(432, Math.min(1600, Math.round(768 * innerHeight / Math.max(innerWidth, 1))));
  canvas.width = W;
  canvas.height = H;
  ctx.imageSmoothingEnabled = false;
}
window.addEventListener('resize', resize);
resize();

function rect(x, y, w, h, color) {
  if (w <= 0 || h <= 0) return;
  ctx.fillStyle = color;
  ctx.fillRect(Math.round(x), Math.round(y), Math.ceil(w), Math.ceil(h));
}
function drawScene(scene,t) {
  bloomHits = drawFinePixelScene(ctx,W,H,scene,t,selectedBloom,TREE_WISHES.length,reduceMotion);
}

function showDialogue(data, duration) {
  clearTimeout(dialogueTimer);
  if(!data) { ui.dialogue.classList.add('hidden'); return; }
  ui.dialogueName.textContent=data.name;
  ui.dialogueText.textContent=data.text;
  ui.dialogue.classList.remove('hidden');
  dialogueTimer=setTimeout(function(){ ui.dialogue.classList.add('hidden'); },duration || 6500);
}
function announce(n) {
  stage=n;
  arrivalTime=performance.now();
  window.__finePixelArrival=arrivalTime;
  ui.stageNumber.textContent=String(n+1);
  ui.objectiveTitle.textContent=STAGES[n].title;
  ui.objectiveText.textContent=descriptions[n];
  ui.actionLabel.textContent=STAGES[n].action;
  ui.action.disabled=false;
  ui.action.classList.toggle('hidden',n===5 || n===9);
  busy=false;
  if(n===0) showDialogue(DIALOGUES.intro,7600);
  if(n===1) showDialogue(DIALOGUES.garden);
  if(n===3) showDialogue(DIALOGUES.school);
  if(n===4) showDialogue(DIALOGUES.classroom);
  if(n===6) showDialogue(DIALOGUES.father,7600);
  if(n===7) showDialogue(DIALOGUES.olderBrother,7600);
  if(n===8) showDialogue(DIALOGUES.youngerBrother,7600);
  if(n===9){
    document.body.classList.add('finale-ui');
    showDialogue(DIALOGUES.finale,4000);
    setTimeout(function(){ui.finalPanel.classList.remove('hidden');},reduceMotion?100:1700);
  }
}
function travel(next,duration) {
  if(busy || transition) return;
  busy=true;
  ui.action.disabled=true;
  ui.dialogue.classList.add('hidden');
  transition={from:stage,to:next,start:performance.now(),duration:reduceMotion?240:(duration || 1250)};
}
function action() {
  if(busy || transition) return;
  if(stage===4) {
    ui.classroomPanel.classList.remove('hidden');
    ui.action.classList.add('hidden');
    showDialogue(DIALOGUES.classroom);
    return;
  }
  if(stage===0 || stage===1 || stage===2 || stage===3 || stage===6 || stage===7 || stage===8) travel(stage+1,stage===3?1450:1100);
}
ui.action.addEventListener('click',action);
ui.dismissClass.addEventListener('click',function() {
  ui.classroomPanel.classList.add('hidden');
  stage=5;
  announce(5);
  showDialogue(DIALOGUES.afterClass,2000);
  setTimeout(function(){ if(stage===5) travel(6,reduceMotion?240:2800); },reduceMotion?300:750);
});
ui.replay.addEventListener('click',function() {
  transition=null;
  selectedBloom=-1;
  ui.classroomPanel.classList.add('hidden');
  ui.finalPanel.classList.add('hidden');
  document.body.classList.remove('finale-ui');
  announce(0);
});

function chooseBloom(index) {
  selectedBloom=index;
  ui.treeWish.textContent='✿ ' + TREE_WISHES[index];
}
canvas.addEventListener('pointerdown',function(e){
  if(stage!==9 || transition) return;
  const bounds=canvas.getBoundingClientRect();
  const x=(e.clientX-bounds.left)*W/bounds.width;
  const y=(e.clientY-bounds.top)*H/bounds.height;
  let hit=null, minDist=24*24;
  for(const b of bloomHits) {
    const d=(b.x-x)**2+(b.y-y)**2;
    if(d<minDist) {minDist=d;hit=b;}
  }
  if(hit) chooseBloom(hit.index);
});
window.addEventListener('keydown',function(e){
  if(e.key==='ArrowRight' && !transition && !busy && !ui.classroomPanel.classList.contains('hidden')) return;
  if(e.key==='ArrowRight' && !transition && !busy) {e.preventDefault();action();}
});
function render(now) {
  requestAnimationFrame(render);
  if(now-lastFrame<30) return;
  lastFrame=now;
  const t=reduceMotion?0:now*.001;
  let activeStage=stage;
  if(transition) {
    const p=Math.min(1,(now-transition.start)/transition.duration);
    activeStage=p<.5?transition.from:transition.to;
    drawScene(activeStage,t);
    // A pixelated curtain replaces 3D camera fly-through transitions.
    const alpha=1-Math.abs(2*p-1);
    ctx.globalAlpha=Math.min(.95,alpha*.98);
    for(let x=0;x<W;x+=20) {
      rect(x,0,20,H,x%40===0?'#fff4d8':'#f4c6d4');
    }
    ctx.globalAlpha=1;
    if(p>=1) {
      const next=transition.to;
      transition=null;
      announce(next);
    }
  } else {
    drawScene(activeStage,t);
  }
}

ui.loading.classList.add('done');
ui.assetStatus.textContent='FINE PIXEL RPG · 768 PX · KHÔNG WEBGL';
window.__APP_READY__=true;
announce(0);
requestAnimationFrame(render);
