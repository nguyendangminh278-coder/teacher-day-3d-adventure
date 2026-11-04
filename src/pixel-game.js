import { CLASS_WISHES, TREE_WISHES, STAGES, DIALOGUES } from './config.js';

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

const C = {
  outline: '#45384e', shadow: '#685571', cream: '#fff1ce',
  sky: '#a5e2e8', skyLight: '#dbf3ec', pink: '#f8a8bc',
  rose: '#ed7498', yellow: '#ffcf70', peach: '#f5bea3',
  green: '#81b99a', darkGreen: '#4e897c', grass: '#b3d8a4',
  white: '#fff9ed', blue: '#7eb9cd', blueDark: '#4c819e',
  brown: '#986c65', darkBrown: '#79535a', lilac: '#c8b2e2'
};
const descriptions = [
  'Bước vào câu chuyện 20/11 được vẽ hoàn toàn bằng pixel.',
  'Dạo qua khu vườn hoa nhỏ xinh trên những đám mây.',
  'Theo con đường pastel để đến trường của mẹ.',
  'Ngôi trường thân thương đã chờ sẵn từ sáng sớm.',
  'Cả lớp có 25 lời chúc nhỏ muốn gửi đến cô.',
  'Một chuyến xe pixel đưa mẹ trở về nhà.',
  'Bố đang đợi mẹ trong phòng khách ấm áp.',
  'Anh trai có một điều muốn nói với mẹ.',
  'Em trai cũng muốn gửi tặng mẹ lời chúc.',
  'Chạm vào những bông hoa trên cây để đọc lời chúc dành cho mẹ.'
];

let W = 384;
let H = 216;
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
  // Constant low horizontal resolution, adapted to portrait as well as landscape.
  W = 384;
  H = Math.max(216, Math.min(780, Math.round(384 * innerHeight / Math.max(innerWidth, 1))));
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
function line(x1, y1, x2, y2, color, thickness) {
  const dx = x2 - x1, dy = y2 - y1, steps = Math.max(Math.abs(dx), Math.abs(dy));
  for (let i = 0; i <= steps; i += 2) {
    rect(x1 + dx * i / Math.max(1, steps), y1 + dy * i / Math.max(1, steps), thickness, thickness, color);
  }
}
function pixelText(str, x, y, size, color) {
  ctx.textAlign = 'center';
  ctx.textBaseline = 'middle';
  ctx.fillStyle = color;
  ctx.font = 'bold ' + size + 'px monospace';
  ctx.fillText(str, Math.round(x), Math.round(y));
}
function cloud(x, y, s, color) {
  rect(x - 20*s, y, 42*s, 8*s, color);
  rect(x - 14*s, y - 7*s, 26*s, 7*s, color);
  rect(x - 6*s, y - 13*s, 17*s, 7*s, color);
  rect(x + 13*s, y - 4*s, 15*s, 8*s, color);
}
function heart(x, y, s, color) {
  rect(x - 3*s, y, 2*s, 2*s, color);
  rect(x + s, y, 2*s, 2*s, color);
  rect(x - 4*s, y + 2*s, 8*s, 2*s, color);
  rect(x - 3*s, y + 4*s, 6*s, 2*s, color);
  rect(x - 2*s, y + 6*s, 4*s, 2*s, color);
  rect(x - s, y + 8*s, 2*s, 2*s, color);
}
function flower(x, y, scale, petal) {
  const s = scale;
  rect(x, y - 2*s, s, 6*s, C.darkGreen);
  rect(x - 3*s, y - 5*s, 3*s, 3*s, petal);
  rect(x + s, y - 5*s, 3*s, 3*s, petal);
  rect(x - s, y - 8*s, 3*s, 3*s, petal);
  rect(x - s, y - 2*s, 3*s, 3*s, petal);
  rect(x, y - 5*s, s, s, C.yellow);
}
function sparkle(x, y, s, color) {
  rect(x - s*3, y, s*7, s, color);
  rect(x, y - s*3, s, s*7, color);
}
function checker(x, y, width, height, spacing, color) {
  for (let cy = y; cy < y + height; cy += spacing) {
    for (let cx = x + (Math.floor(cy / spacing) % 2) * spacing; cx < x + width; cx += spacing * 2) {
      rect(cx, cy, 2, 2, color);
    }
  }
}
function background(t, kind) {
  const ground = Math.round(H * .73);
  const indoor = kind === 'indoor';
  if (indoor) {
    rect(0, 0, W, H, '#f6dcc4');
    rect(0, 0, W, Math.max(0, ground-85), '#f5e4d7');
    rect(0, ground - 83, W, 4, C.white);
    rect(0, ground - 79, W, 3, '#d9b6a5');
    rect(0, ground, W, H-ground, '#d3ae91');
    checker(0, ground + 8, W, H-ground-8, 22, '#be998a');
    rect(0, ground - 6, W, 6, C.darkBrown);
  } else {
    rect(0, 0, W, H, kind === 'finale' ? '#bbdce5' : C.sky);
    rect(0, 0, W, Math.round(ground*.35), kind === 'finale' ? '#b0c9e1' : '#9dd1e8');
    rect(0, Math.round(ground*.35), W, Math.round(ground*.34), C.sky);
    rect(0, Math.round(ground*.69), W, Math.round(ground*.31), C.skyLight);
    for (let i = 0; i < 7; i++) {
      const drift = Math.sin(t * .27 + i * 2) * 3;
      cloud((i*83 + 25) % (W+80) - 40 + drift, ground*.23 + (i%3)*23, .75+(i%3)*.25, '#f5f4e7');
    }
    for (let i = 0; i < 4; i++) {
      rect(i*120 - 35, ground - 19 - (i%2)*14, 97, 32, '#9acbc0');
      rect(i*120 - 10, ground - 25 - (i%2)*14, 56, 16, '#9acbc0');
    }
    rect(0, ground, W, H-ground, kind === 'road' ? '#c2d2b3' : '#a6cfa4');
    rect(0, ground+4, W, 8, kind === 'road' ? '#a2c09e' : '#91bf96');
    checker(0, ground+16, W, H-ground-16, 18, '#88b897');
  }
  return ground;
}
function sceneFlowers(y, amount, t) {
  for (let i=0; i<amount; i++) {
    const x = (i*53 + 17) % W;
    flower(x, y + 22 + (i%3)*12, i%4===0?2:1,
      [C.pink,C.yellow,C.lilac,C.white][i%4]);
  }
  for (let i=0; i<8; i++) {
    const x = ((i*83 + Math.sin(t*.5+i)*7) % W + W)%W;
    sparkle(x, y - 36 - (i%3)*20, 1, i%2 ? C.white : C.yellow);
  }
}
function pixelPerson(cx, feet, type, scale, t, walking) {
  const s = scale || 2;
  const x = Math.round(cx-10*s), y=Math.round(feet-31*s);
  const dad = type==='dad', older = type==='older', younger = type==='younger';
  const skin = '#edb899';
  const hair = dad ? '#50404d' : younger ? '#685065' : '#443c4c';
  const outfit = dad ? '#648aa8' : older ? '#93b997' : younger ? '#e5a077' : '#83c7cf';
  const trim = dad ? '#e7bf98' : older ? '#d9e7ab' : younger ? '#f9d1a4' : '#ccefe3';
  const stride = walking ? Math.round(Math.sin(t*8)*s*2) : 0;
  // Pixel shadow, shoes, legs and áo dài silhouette for the teacher.
  rect(x+3*s, feet+1, 14*s, 2*s, '#729b8d');
  rect(x+5*s, y+26*s, 4*s, 5*s + Math.max(0,stride), '#594b66');
  rect(x+11*s, y+26*s + Math.max(0,-stride), 4*s, 5*s, '#594b66');
  rect(x+4*s, y+29*s, 5*s, 2*s, C.outline);
  rect(x+11*s, y+29*s, 5*s, 2*s, C.outline);
  rect(x+4*s, y+13*s, 12*s, 14*s, outfit);
  rect(x+3*s, y+24*s, 14*s, 3*s, outfit);
  rect(x+7*s, y+14*s, 6*s, 9*s, trim);
  rect(x+6*s, y+12*s, 8*s, 3*s, outfit);
  rect(x+2*s, y+15*s, 3*s, 11*s, outfit);
  const waving = type==='mom' && (stage===0 || stage===9);
  rect(x+15*s, y+(waving?10:15)*s, 3*s, 10*s, outfit);
  rect(x+15*s, y+(waving?8:23)*s, 3*s, 3*s, skin);
  rect(x+3*s, y+24*s, 3*s, 3*s, skin);
  rect(x+5*s, y+2*s, 10*s, 11*s, hair);
  rect(x+4*s, y+5*s, 12*s, 7*s, hair);
  rect(x+6*s, y+5*s, 8*s, 8*s, skin);
  rect(x+4*s, y+11*s, 2*s, 5*s, hair);
  rect(x+14*s, y+10*s, 2*s, 7*s, hair);
  rect(x+8*s, y+9*s, s, s, C.outline);
  rect(x+12*s, y+9*s, s, s, C.outline);
  rect(x+9*s, y+12*s, 3*s, s, '#b96c78');
  rect(x+7*s, y+3*s, 8*s, 2*s, hair);
  rect(x+6*s, y+10*s, s, s, '#f5a3a6');
  rect(x+13*s, y+10*s, s, s, '#f5a3a6');
}
function shrub(x, y, scale) {
  const s=scale;
  rect(x-9*s,y-6*s,18*s,6*s,'#4e8d79');
  rect(x-13*s,y-10*s,26*s,6*s,'#71b399');
  rect(x-9*s,y-14*s,18*s,5*s,'#85c4a2');
  rect(x-3*s,y-18*s,8*s,5*s,'#9ed1ae');
}
function gate(x,y,width) {
  rect(x-width/2, y-65, width, 8, '#d36e8d');
  rect(x-width/2+7, y-71, width-14, 7, '#ee9cb0');
  rect(x-width/2+4, y-58, 12, 59, '#eac1a4');
  rect(x+width/2-16, y-58, 12, 59, '#eac1a4');
  rect(x-width/2+2, y-64, width-4, 5, C.outline);
  rect(x-width/2+13, y-49, width-26, 3, '#f9e8d6');
  rect(x-width/2+16, y-43, 4, 44, '#7daea7');
  rect(x+width/2-20, y-43, 4, 44, '#7daea7');
  pixelText('TRƯỜNG HOA MÂY',x,y-60,10,'#583a56');
}
function school(x,y,s) {
  // x = building centre, y = ground, s = depth scaling.
  const pw=140*s, ph=82*s;
  rect(x-pw/2, y-ph, pw, ph, '#f5cfb0');
  rect(x-pw/2-5*s,y-ph-6*s,pw+10*s,9*s,'#e39aaf');
  rect(x-23*s,y-ph-20*s,46*s,15*s,C.white);
  pixelText('20/11',x,y-ph-12*s,10*s,'#b56e8c');
  for (let i=-1;i<=1;i++) {
    rect(x+(i*38-11)*s,y-ph+18*s,22*s,29*s,'#8dbbb6');
    rect(x+(i*38-8)*s,y-ph+21*s,16*s,22*s,'#cce8d9');
  }
  rect(x-14*s,y-35*s,28*s,35*s,'#7ba6a4');
  rect(x-9*s,y-31*s,18*s,31*s,'#e2f1db');
  rect(x-65*s,y-7*s,130*s,7*s,'#dd9b9a');
}
function home(x,y,s) {
  const w=132*s;
  rect(x-w/2,y-82*s,w,82*s,'#f5d7af');
  rect(x-w/2-9*s,y-89*s,w+18*s,10*s,'#b77f86');
  rect(x-w/2+5*s,y-94*s,w-10*s,7*s,'#d69598');
  rect(x-17*s,y-30*s,34*s,30*s,'#9e6f70');
  rect(x-12*s,y-25*s,24*s,25*s,'#ebbe9b');
  for(const d of [-1,1]) {
    rect(x+d*43*s-10*s,y-66*s,22*s,25*s,'#7db6b0');
    rect(x+d*43*s-7*s,y-63*s,16*s,19*s,'#bfe6df');
    rect(x+d*43*s,y-63*s,s*2,19*s,'#f8e7d0');
  }
  rect(x-7*s,y-12*s,3*s,3*s,C.yellow);
  rect(x+38*s,y-111*s,13*s,23*s,'#8f6670');
}
function furniture(y, kind) {
  // Little wooden-framed windows and furniture for the family's home.
  rect(24, y-120, 67, 53, '#a67e7c');
  rect(28, y-116, 59, 45, '#b9dce0');
  rect(55, y-116, 4, 45, '#e8d2b3');
  rect(29, y-92, 58, 4, '#e8d2b3');
  cloud(53,y-91,.48,C.white);
  rect(W-105,y-137,56,42,'#936f73');
  rect(W-100,y-132,46,32,'#ffe9b6');
  heart(W-77,y-124,2,C.rose);
  rect(30,y-37,103,26,'#aa8c95');
  rect(37,y-42,87,13,'#cfa6a6');
  rect(36,y-9,6,10,C.darkBrown);
  rect(117,y-9,6,10,C.darkBrown);
  rect(W-83,y-57,23,50,C.brown);
  rect(W-92,y-62,42,7,C.darkBrown);
  rect(W-84,y-68,24,7,kind==='book' ? '#78b8b1' : '#f4c786');
  rect(W/2-51,y+12,102,9,'#b58081');
  rect(W/2-45,y+21,90,4,'#e5b8a3');
  shrub(W-33,y-21,1);
}
function desk(x,y,s) {
  rect(x-15*s,y-8*s,30*s,8*s,'#ae827c');
  rect(x-14*s,y,3*s,9*s,'#825f65');
  rect(x+11*s,y,3*s,9*s,'#825f65');
  rect(x-8*s,y-21*s,16*s,11*s,'#daaa91');
  rect(x-7*s,y-25*s,14*s,6*s,'#514554');
}
function classroom(y,t) {
  background(t,'indoor');
  rect(40,y-134,W-80,67,'#f1d6c1');
  rect(59,y-124,W-118,58,C.darkBrown);
  rect(64,y-120,W-128,48,'#497c75');
  pixelText('20 / 11',W/2,y-102,17,C.cream);
  pixelText('CẢM ƠN CÔ',W/2,y-82,11,C.cream);
  rect(36,y-59,W-72,5,C.brown);
  for (let i=0;i<5;i++) desk(42 + i*75,y+21,1.2);
  for (let i=0;i<4;i++) desk(72 + i*80,y+47,1.1);
  pixelPerson(W/2,y-8,'mom',1.5,t,false);
  for (let i=0;i<5;i++) heart(45+i*66, y-143-(i%2)*7,1.3,i%2?C.rose:C.yellow);
}
function garden(y,t) {
  background(t,'outdoor');
  rect(W/2-57,y-13,114,H-y+13,'#f8dfc9');
  rect(W/2-48,y-13,96,H-y+13,'#fcebd9');
  rect(W/2-3,y-7,6,8,'#fff9ed');
  for(let i=0;i<12;i++) {
    const x=i%2 ? W/2+70+(i%3)*20 : W/2-70-(i%3)*20;
    flower(x,y+8+(i%6)*16,2,[C.rose,C.lilac,C.yellow][i%3]);
  }
  shrub(27,y+12,2);
  shrub(W-26,y+14,2);
  pixelPerson(W/2,y-12,'mom',2.1,t,true);
}
function road(y,t) {
  background(t,'road');
  rect(0,y-10,W,H-y+10,'#cfb8ae');
  rect(0,y-7,W,4,'#aa968e');
  rect(0,y+10,W,H-y-10,'#b29b99');
  for(let i=0;i<10;i++) rect(i*52-18,y+27,23,4,C.cream);
  for(let i=0;i<8;i++) {
    const x=(i*57+15)%W;
    flower(x,y-14,1.5,i%2?C.rose:C.yellow);
  }
  school(W/2+87,y-13,.7);
  pixelPerson(W/2-70,y-12,'mom',2,t,true);
}
function intro(y,t) {
  background(t,'outdoor');
  sceneFlowers(y,10,t);
  const px=W/2, py=y-77;
  rect(px-32,py-54,64,61,C.lilac);
  rect(px-25,py-49,50,50,'#8ca5cb');
  rect(px-18,py-41,36,41,'#4e5b90');
  rect(px-11,py-33,22,32,'#6d6aa4');
  sparkle(px,py-16,2,C.cream);
  for(let i=0;i<5;i++) sparkle(px-38+i*19,py-60-(i%2)*12,1,C.yellow);
  cloud(px-67,py+8,1.6,C.white);
  cloud(px+46,py+10,1.5,C.white);
  pixelText('20 / 11',px,py-75,16,'#784d76');
  pixelPerson(px,y-5+Math.sin(t*2)*2,'mom',2.2,t,false);
}
function schoolGate(y,t) {
  background(t,'outdoor');
  school(W/2,y-33,1.65);
  gate(W/2,y,204);
  flower(47,y+16,2,C.rose);
  flower(W-48,y+16,2,C.yellow);
  pixelPerson(W/2,y+18,'mom',1.9,t,true);
}
function car(x,y,t) {
  rect(x-35,y-12,76,21,'#e8899d');
  rect(x-22,y-26,48,15,'#e8899d');
  rect(x-17,y-23,18,12,'#acd8d8');
  rect(x+4,y-23,18,12,'#acd8d8');
  rect(x-35,y+3,76,6,C.outline);
  for(const dx of [-23,27]) {
    rect(x+dx-7,y+1,15,15,C.outline);
    rect(x+dx-3,y+5,7,7,'#c9bbba');
  }
  rect(x-39,y-8,5,8,C.cream);
  rect(x+40,y-8,4,8,C.yellow);
  rect(x-20,y-27,45,3,C.white);
}
function commute(y,t) {
  background(t,'road');
  home(W-78,y-20,.7);
  rect(0,y+17,W,H-y-17,'#bca8a2');
  rect(0,y+17,W,5,'#8e938e');
  for(let i=0;i<8;i++) rect((i*61+Math.round(t*35))%W,y+47,25,3,C.cream);
  car(W/2-35 + 18*Math.sin(t*.5),y+2,t);
  flower(43,y+3,2,C.rose);
}
function room(y,t,personType) {
  background(t,'indoor');
  furniture(y,personType==='older'?'book':'other');
  if(personType==='dad'){
    pixelText('MÁI NHÀ CỦA MẸ', W/2,y-155,12,C.darkBrown);
    pixelPerson(W/2-53,y+8,'mom',1.75,t,false);
    pixelPerson(W/2+42,y+8,'dad',1.82,t,false);
    heart(W/2-2,y-87,2.1,C.rose);
  } else {
    pixelText('TẦNG 2 · GIA ĐÌNH', W/2,y-155,12,C.darkBrown);
    pixelPerson(W/2-51,y+8,'mom',1.73,t,false);
    pixelPerson(W/2+38,y+8,personType,1.7,t,false);
    heart(W/2-7,y-85,1.6,C.rose);
    rect(W/2+70,y-32,33,7,'#bd918b');
    rect(W/2+78,y-25,4,24,C.brown);
    rect(W/2+96,y-25,4,24,C.brown);
  }
}
function tree(x,y,t,progress) {
  rect(x-13,y-86,25,88,'#835d5c');
  rect(x-8,y-82,8,80,'#ae7b65');
  rect(x-44,y-108,19,14,'#835d5c');
  rect(x-33,y-112,17,37,'#835d5c');
  rect(x+18,y-119,16,42,'#835d5c');
  rect(x+28,y-134,14,23,'#835d5c');
  for(let i=0;i<14;i++){
    const a=i*2.4, r=20+(i%3)*21;
    const lx=x+Math.cos(a)*r, ly=y-126+Math.sin(a)*39;
    rect(lx-20,ly-13,40,27,i%2?'#72af8d':'#84bb92');
    rect(lx-14,ly-20,28,10,i%2?'#8ecba3':'#9ed1a7');
    rect(lx-23,ly-7,46,12,'#6b9f83');
  }
  bloomHits = [];
  for(let i=0;i<TREE_WISHES.length;i++){
    const angle = i*2.39996, radius=18+(i%6)*12;
    const fx=Math.round(x+Math.cos(angle)*radius);
    const fy=Math.round(y-132+Math.sin(angle)*radius*.73);
    const grow = Math.max(0,Math.min(1,progress*1.65-i*.028));
    if(grow<=0) continue;
    const s=grow>=.75 ? 2 : 1;
    flower(fx,fy,s,[C.rose,C.pink,C.yellow,C.lilac][i%4]);
    bloomHits.push({x:fx,y:fy,index:i});
    if(selectedBloom===i) sparkle(fx,fy-14,1.5,C.white);
  }
  rect(x-74,y+4,148,7,'#7da783');
  rect(x-57,y+11,115,5,'#aed2a3');
}
function finale(y,t) {
  background(t,'finale');
  sceneFlowers(y,12,t);
  const age=(performance.now()-arrivalTime)/(reduceMotion?400:3300);
  tree(W/2+54,y+19,t,Math.min(1,age));
  pixelPerson(W/2-82,y+14,'mom',1.45,t,false);
  for(let i=0;i<9;i++) {
    const x=(i*47+Math.sin(t+i)*6)%W;
    const py=y-43-(i%5)*22+Math.sin(t*1.7+i)*4;
    heart(x,py,1,i%2?C.rose:C.yellow);
  }
}
function drawScene(scene,t) {
  const y=Math.round(H*.73);
  switch(scene) {
    case 0: intro(y,t); break;
    case 1: garden(y,t); break;
    case 2: road(y,t); break;
    case 3: schoolGate(y,t); break;
    case 4: classroom(y,t); break;
    case 5: commute(y,t); break;
    case 6: room(y,t,'dad'); break;
    case 7: room(y,t,'older'); break;
    case 8: room(y,t,'younger'); break;
    case 9: finale(y,t); break;
    default: intro(y,t);
  }
  rect(0,H-4,W,4,C.outline);
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
ui.assetStatus.textContent='PIXEL EDITION · CANVAS 2D · KHÔNG CẦN WEBGL';
window.__APP_READY__=true;
announce(0);
requestAnimationFrame(render);
