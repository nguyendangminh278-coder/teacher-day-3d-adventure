import { CLASS_WISHES, TREE_WISHES, STAGES, DIALOGUES } from './config.js';
import { drawStoryLocation, drawRpgOverworld } from './fine-pixel-art.js';

/*
 * Teacher's Day 2D story. A real 15-step route:
 * map -> walk -> school exterior -> hallway -> class -> school exit
 * -> map/board car -> road trip -> home exterior -> dad on floor 1
 * -> stairs -> older son -> younger son -> final stairs -> wish tree on floor 3.
 *
 * All image scenes are custom detailed raster illustrations rendered by
 * fine-pixel-art.js, not text-only screens.
 */
const canvas=document.getElementById('game');
const ctx=canvas.getContext('2d',{alpha:false});
const $=id=>document.getElementById(id);
const ui={
 action:$('actionBtn'),actionLabel:$('actionLabel'),
 stageNumber:$('stageNumber'),stageTotal:$('stageTotal'),
 objectiveTitle:$('objectiveTitle'),objectiveText:$('objectiveText'),
 dialogue:$('dialogue'),dialogueName:$('dialogueName'),dialogueText:$('dialogueText'),
 classPanel:$('classroomPanel'),classWishes:$('classWishes'),
 dismissClass:$('dismissClass'),finalPanel:$('finalPanel'),treeWish:$('treeWish'),
 replay:$('replayBtn'),mapHotspots:$('mapHotspots'),mapHint:$('mapHint'),
 mapReturn:$('mapReturn'),mapFade:$('mapFade'),
 assetStatus:$('assetStatus'),loading:$('loading'),
 sceneBanner:$('sceneBanner'),sceneSubtitle:$('sceneSubtitle'),
 storyProgress:$('storyProgress'),controls:$('controlsPanel'),
 achievement:$('achievementBtn'),journal:$('journalBtn'),settings:$('settingsBtn'),
 infoPanel:$('infoPanel'),infoTitle:$('infoTitle'),infoBody:$('infoBody'),infoClose:$('infoClose'),
 motionButton:$('motionButton'),progressFill:$('progressFill')
};
const placeButtons=Object.fromEntries(
 [...document.querySelectorAll('[data-place]')].map(b=>[b.dataset.place,b])
);
const controlsButtons=[...document.querySelectorAll('[data-move]')];

const SCENES={
 2:{id:'school-front',tag:'TRƯỜNG HỌC HOA MÂY',sub:'Sân trường rực rỡ hoa ngày 20/11'},
 3:{id:'school-hall',tag:'HÀNH LANG TRƯỜNG',sub:'Lối vào lớp học của mẹ'},
 4:{id:'classroom',tag:'LỚP HỌC CỦA MẸ',sub:'25 lời chúc từ những học trò thân yêu'},
 5:{id:'school-exit',tag:'TAN LỚP · RA CỔNG TRƯỜNG',sub:'Cùng mẹ ra khỏi trường để đón xe'},
 6:{id:'car-boarding',tag:'ĐIỂM ĐÓN XE',sub:'Mẹ đã đến xe, chuẩn bị lên xe về nhà'},
 7:{id:'car-driving',tag:'TRÊN ĐƯỜNG VỀ NHÀ',sub:'Chuyến xe êm đềm xuyên qua làng hoa'},
 8:{id:'home-front',tag:'ĐÃ VỀ ĐẾN NHÀ',sub:'Ngôi nhà nhỏ ấm áp đang chờ mẹ'},
 9:{id:'floor1',tag:'TẦNG 1 · BỐ CHÚC MẸ',sub:'Phòng khách ấm cúng của gia đình'},
 10:{id:'stairs',tag:'CẦU THANG LÊN TẦNG 2',sub:'Mẹ bước lên từng bậc thang trong nhà'},
 11:{id:'floor2older',tag:'TẦNG 2 · ANH TRAI',sub:'Một lời chúc từ người con trai lớn'},
 12:{id:'floor2younger',tag:'TẦNG 2 · EM TRAI',sub:'Lời chúc ngọt ngào từ người con trai nhỏ'},
 13:{id:'stairs',tag:'CẦU THANG LÊN TẦNG 3',sub:'Bí mật cuối cùng nằm ở tầng cao nhất'},
 14:{id:'wish-rooftop',tag:'TẦNG 3 · CÂY ĐIỀU ƯỚC',sub:'Mỗi bông hoa là một điều ước dành cho mẹ'}
};

const PLACES={
 school:{x:364,dy:-14,label:'TRƯỜNG HỌC'},
 car:{x:527,dy:29,label:'ĐI BẰNG XE'},
 home:{x:158,dy:35,label:'NHÀ CỦA MẸ'},
 wish:{x:657,dy:71,label:'CÂY ĐIỀU ƯỚC'}
};
let W=768,H=432,stage=0,view='map',unlock='school';
let actor={x:382,y:352,visible:true,walking:false};
let traveling=null,vehicle=null,transitioning=false;
let selectedBloom=-1,bloomHits=[],frameAt=0,frameClock=0;
let dialogueTimer,driveTimer,finaleTimer,fadeTimer;
let reduceMotion=Boolean(window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches);
let infoMode='journal';
let pressed=new Set();
let lastTooltip='';
let homeFloorReached=0;
const getGround=()=>Math.round(H*.72);
const target=place=>({x:PLACES[place].x,y:getGround()+PLACES[place].dy});
function dismissInfo(){ui.infoPanel.classList.add('hidden');}
function updateProgress() {
 ui.stageNumber.textContent=String(stage+1);
 ui.stageTotal.textContent=String(STAGES.length);
 ui.progressFill.style.width=((stage+1)/STAGES.length*100).toFixed(1)+'%';
}
CLASS_WISHES.forEach((wish,i)=>{
 const card=document.createElement('div');
 card.className='wish-card';
 const label=document.createElement('span');
 label.className='wish-number';
 label.textContent=String(i+1).padStart(2,'0');
 const content=document.createElement('span');content.textContent=wish;
 card.append(label,content);ui.classWishes.append(card);
});

function placeMarkers(){
 for(const [key,button] of Object.entries(placeButtons)){
  const p=target(key);
  button.style.left=(p.x/W*100).toFixed(3)+'%';
  button.style.top=(Math.min(H-12,p.y-28)/H*100).toFixed(3)+'%';
 }
}
function resize(){
 const oldGround=getGround();
 W=768;H=Math.max(432,Math.min(1550,Math.round(W*innerHeight/Math.max(1,innerWidth))));
 canvas.width=W;canvas.height=H;ctx.imageSmoothingEnabled=false;
 const diff=getGround()-oldGround;
 actor.y+=diff;
 if(vehicle)vehicle.y+=diff;
 if(traveling)traveling.points.forEach(pt=>pt.y+=diff);
 placeMarkers();
}
window.addEventListener('resize',resize);
resize();
actor={x:385,y:getGround()+55,visible:true,walking:false};

function showDialogue(d,ms=6000){
 clearTimeout(dialogueTimer);
 if(!d){ui.dialogue.classList.add('hidden');return;}
 ui.dialogueName.textContent=d.name;
 ui.dialogueText.textContent=d.text;
 ui.dialogue.classList.remove('hidden');
 dialogueTimer=setTimeout(()=>ui.dialogue.classList.add('hidden'),ms);
}
function updateControls(){
 const map=view==='map';
 ui.mapHotspots.classList.toggle('hidden',!map);
 ui.controls.classList.toggle('hidden',!map);
 ui.mapHint.classList.toggle('hidden',!map);
 ui.mapReturn.classList.toggle('hidden',map||stage===14);
 ui.sceneBanner.classList.toggle('hidden',map);
 ui.action.classList.toggle('hidden',stage===14||stage===4&&!ui.classPanel.classList.contains('hidden'));
 ui.action.disabled=Boolean(traveling||transitioning);
 const current=map && (stage===0||stage===1)?'school':map?'car':null;
 for(const [key,b] of Object.entries(placeButtons)){
  const open=map && key===current && !traveling && !transitioning;
  b.disabled=!open;
  b.classList.toggle('is-active',open);
  b.classList.toggle('is-locked',!open);
  b.setAttribute('aria-label',open?'Đi tới '+PLACES[key].label:PLACES[key].label+' (chưa mở khóa)');
 }
 const actionLabels={
  0:'ĐI ĐẾN TRƯỜNG',1:'ĐANG ĐI ĐẾN TRƯỜNG...',
  2:'VÀO TRƯỜNG',3:'VÀO LỚP HỌC',4:'ĐỌC 25 LỜI CHÚC',
  5:map?'ĐẾN XE':'RA KHỎI TRƯỜNG',6:'LÊN XE',
  7:'TIẾP TỤC VỀ NHÀ',8:'VÀO NHÀ',
  9:'LÊN CẦU THANG',10:'LÊN TẦNG 2',
  11:'GẶP EM TRAI',12:'LÊN TẦNG TRÊN CÙNG',
  13:'MỞ CÂY ĐIỀU ƯỚC'
 };
 ui.actionLabel.textContent=actionLabels[stage]||'TIẾP TỤC';
 ui.mapHint.textContent=map
  ? stage<2?'✦ Đến Trường học bằng phím ↑ ↓ ← → / WASD, nút di chuyển hoặc chạm địa điểm.'
   :'✦ Tan lớp rồi! Hãy di chuyển đến xe và nhấn E, hoặc bấm ĐẾN XE.'
  :'';
 ui.sceneBanner.querySelector('strong').textContent=SCENES[stage]?.tag||'HÀNH TRÌNH 20/11';
 ui.sceneSubtitle.textContent=SCENES[stage]?.sub||'';
 ui.assetStatus.textContent=map?'BẢN ĐỒ LÀNG HOA · PIXEL ART RPG':SCENES[stage]?.tag||'HÀNH TRÌNH';
}
function setStage(n){
 clearTimeout(driveTimer);
 clearTimeout(finaleTimer);
 stage=n;
 window.__finePixelArrival=performance.now();
 updateProgress();
 ui.objectiveTitle.textContent=STAGES[n].title;
 ui.objectiveText.textContent=STAGES[n].text;
 ui.classPanel.classList.add('hidden');
 if(n!==14){
  document.body.classList.remove('finale-ui');
  ui.finalPanel.classList.add('hidden');
 }
 if(n===2)showDialogue(DIALOGUES.school,6200);
 if(n===3)showDialogue({name:'Mẹ',text:'Hành lang thật thân quen. Mẹ cùng vào lớp nhé!'},5400);
 if(n===4)showDialogue(DIALOGUES.classroom,7600);
 if(n===5)showDialogue(DIALOGUES.afterClass,7000);
 if(n===6)showDialogue({name:'Mẹ',text:'Xe đến rồi! Mình lên xe về nhà thôi.'},5200);
 if(n===8)showDialogue(DIALOGUES.home,6200);
 if(n===9)showDialogue(DIALOGUES.father,9000);
 if(n===11)showDialogue(DIALOGUES.olderBrother,8500);
 if(n===12)showDialogue(DIALOGUES.youngerBrother,8500);
 if(n===13)showDialogue(DIALOGUES.upstairs,5600);
 if(n===14){
  document.body.classList.add('finale-ui');
  showDialogue(DIALOGUES.finale,6800);
  finaleTimer=setTimeout(()=>ui.finalPanel.classList.remove('hidden'),reduceMotion?100:1700);
 }
 if(n===7){
  // The journey is visible, not an instant teleport from school to home.
  driveTimer=setTimeout(()=>sceneTransition(8),reduceMotion?750:4400);
 }
 updateControls();
}
function sceneTransition(next) {
 if(transitioning)return;
 transitioning=true;
 ui.dialogue.classList.add('hidden');
 ui.mapFade.classList.add('on');
 updateControls();
 clearTimeout(fadeTimer);
 fadeTimer=setTimeout(()=>{
  view='scene';
  transitioning=false;
  ui.mapFade.classList.remove('on');
  setStage(next);
 },reduceMotion?10:300);
}
function returnToOverworld(){
 if(transitioning)return;
 transitioning=true;
 ui.mapFade.classList.add('on');
 fadeTimer=setTimeout(()=>{
  view='map';transitioning=false;
  ui.mapFade.classList.remove('on');
  actor.walking=false;actor.visible=true;
  if(stage<5){
   actor=Object.assign(actor,target('school'));
  }else{
   actor=Object.assign(actor,target('school'));
   setStage(5);
  }
  updateControls();
 },reduceMotion?10:300);
}
function linearAlong(points,t) {
 let full=0;const lengths=[];
 for(let i=1;i<points.length;i++){
  const len=Math.hypot(points[i].x-points[i-1].x,points[i].y-points[i-1].y);
  lengths.push(len);full+=len;
 }
 let distance=Math.max(0,Math.min(1,t))*full;
 for(let i=0;i<lengths.length;i++){
  if(distance<=lengths[i]||i===lengths.length-1){
   const r=lengths[i]?Math.min(1,distance/lengths[i]):1;
   return{x:points[i].x+(points[i+1].x-points[i].x)*r,
          y:points[i].y+(points[i+1].y-points[i].y)*r};
  }
  distance-=lengths[i];
 }
 return points[points.length-1];
}
function startWalk(place,done){
 if(traveling||transitioning||view!=='map')return;
 const finish=target(place),base=getGround();
 const points=place==='school'
  ?[{x:actor.x,y:actor.y},{x:382,y:base+33},{x:365,y:base+3},finish]
  :[{x:actor.x,y:actor.y},{x:374,y:base+40},{x:446,y:base+37},finish];
 const len=points.reduce((sum,p,i)=>i?sum+Math.hypot(p.x-points[i-1].x,p.y-points[i-1].y):0,0);
 traveling={points,started:performance.now(),duration:reduceMotion?190:Math.max(1300,Math.min(3500,len/65*1000)),onDone:done};
 actor.walking=true;
 if(place==='school')setStage(1);
 updateControls();
}
function finishWalk(now){
 if(!traveling)return;
 const t=Math.max(0,Math.min(1,(now-traveling.started)/traveling.duration));
 Object.assign(actor,linearAlong(traveling.points,t));
 if(t>=1){
  const done=traveling.onDone;
  traveling=null;actor.walking=false;
  done?.();updateControls();
 }
}
function arrivedAtPlace(place) {
 if(place==='school')sceneTransition(2);
 if(place==='car')sceneTransition(6);
}
function selectPlace(place){
 if(view!=='map'||traveling||transitioning)return;
 const eligible=(stage<=1&&place==='school')||(stage===5&&place==='car');
 if(!eligible)return;
 const p=target(place);
 if(Math.hypot(p.x-actor.x,p.y-actor.y)<53)arrivedAtPlace(place);
 else startWalk(place,()=>arrivedAtPlace(place));
}
Object.entries(placeButtons).forEach(([place,button])=>button.addEventListener('click',()=>selectPlace(place)));

function action() {
 if(traveling||transitioning)return;
 if(view==='map')return selectPlace(stage<2?'school':'car');
 if(stage===2)sceneTransition(3);
 else if(stage===3)sceneTransition(4);
 else if(stage===4) {
  ui.classPanel.classList.remove('hidden');
  showDialogue(DIALOGUES.classroom,8200);
  updateControls();
 }
 else if(stage===5)returnToOverworld();
 else if(stage===6)sceneTransition(7);
 else if(stage===7){clearTimeout(driveTimer);sceneTransition(8);}
 else if(stage===8)sceneTransition(9);
 else if(stage===9)sceneTransition(10);
 else if(stage===10)sceneTransition(11);
 else if(stage===11)sceneTransition(12);
 else if(stage===12)sceneTransition(13);
 else if(stage===13)sceneTransition(14);
}
ui.action.addEventListener('click',action);
ui.dismissClass.addEventListener('click',()=>{
 ui.classPanel.classList.add('hidden');
 sceneTransition(5); // Explicitly show mother walking OUT OF the school.
});
ui.mapReturn.addEventListener('click',()=>{
 if(view!=='scene'||traveling||transitioning||stage===14)return;
 if(stage<=4||stage===5)returnToOverworld();
 if(stage===8)returnToOverworld();
});
ui.replay.addEventListener('click',()=>{
 clearTimeout(driveTimer);clearTimeout(dialogueTimer);clearTimeout(finaleTimer);clearTimeout(fadeTimer);
 view='map';stage=0;unlock='school';traveling=null;vehicle=null;transitioning=false;
 pressed.clear();selectedBloom=-1;bloomHits=[];homeFloorReached=0;
 actor={x:383,y:getGround()+53,visible:true,walking:false};
 ui.classPanel.classList.add('hidden');ui.finalPanel.classList.add('hidden');
 ui.mapFade.classList.remove('on');
 setStage(0);showDialogue(DIALOGUES.intro,8000);
});

function revealWish(index){
 selectedBloom=index;
 ui.treeWish.textContent='✿ '+TREE_WISHES[index];
}
canvas.addEventListener('pointerdown',e=>{
 if(transitioning||traveling)return;
 const b=canvas.getBoundingClientRect();
 const x=(e.clientX-b.left)/Math.max(1,b.width)*W;
 const y=(e.clientY-b.top)/Math.max(1,b.height)*H;
 if(view==='map'){
  const name=stage<2?'school':'car',pt=target(name);
  if(Math.hypot(x-pt.x,y-pt.y)<68)selectPlace(name);
 }else if(stage===14){
  let nearest=null,dist=28*28;
  for(const hit of bloomHits) {
   const d=(hit.x-x)**2+(hit.y-y)**2;
   if(d<dist){nearest=hit;dist=d;}
  }
  if(nearest)revealWish(nearest.index);
 }
});
function handleManualMove(dx,dy,dt) {
 if(view!=='map'||traveling||transitioning)return;
 if(stage!==0&&stage!==5)return;
 if(!dx&&!dy){actor.walking=false;return;}
 const mag=Math.hypot(dx,dy);
 const speed=reduceMotion?120:122;
 actor.x=Math.max(25,Math.min(W-25,actor.x+dx/mag*speed*dt));
 actor.y=Math.max(getGround()-52,Math.min(H-12,actor.y+dy/mag*speed*dt));
 actor.walking=true;
}
function keyDirection(){
 let dx=0,dy=0;
 if(pressed.has('ArrowLeft')||pressed.has('a'))dx--;
 if(pressed.has('ArrowRight')||pressed.has('d'))dx++;
 if(pressed.has('ArrowUp')||pressed.has('w'))dy--;
 if(pressed.has('ArrowDown')||pressed.has('s'))dy++;
 return [dx,dy];
}
window.addEventListener('keydown',e=>{
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight',' ','e','E'].includes(e.key))e.preventDefault();
 if(e.key==='Escape'){
  dismissInfo();if(!ui.classPanel.classList.contains('hidden'))ui.classPanel.classList.add('hidden');
  return;
 }
 const name=e.key.length===1?e.key.toLowerCase():e.key;
 if(['ArrowUp','ArrowDown','ArrowLeft','ArrowRight','w','a','s','d'].includes(name))pressed.add(name);
 if(e.repeat)return;
 if(name==='e'||name==='Enter'||name===' '){
  if(!ui.infoPanel.classList.contains('hidden')){dismissInfo();return;}
  if(view==='map') {
   const pt=target(stage<2?'school':'car');
   if(Math.hypot(pt.x-actor.x,pt.y-actor.y)<74)selectPlace(stage<2?'school':'car');
   else action();
  }else action();
 }
});
window.addEventListener('keyup',e=>pressed.delete(e.key.length===1?e.key.toLowerCase():e.key));
window.addEventListener('blur',()=>pressed.clear());
controlsButtons.forEach(button=>{
 const direction=button.dataset.move;
 const down=e=>{e.preventDefault();pressed.add(direction);button.setPointerCapture?.(e.pointerId);};
 const up=()=>pressed.delete(direction);
 button.addEventListener('pointerdown',down);
 button.addEventListener('pointerup',up);
 button.addEventListener('pointercancel',up);
 button.addEventListener('lostpointercapture',up);
});
$('enterBtn').addEventListener('click',()=>{
 if(view==='map'){
  const place=stage<2?'school':'car';
  const pt=target(place);
  if(Math.hypot(pt.x-actor.x,pt.y-actor.y)<74)selectPlace(place);
  else action();
 }else action();
});
function openInfo(mode){
 infoMode=mode;
 ui.infoPanel.classList.remove('hidden');
 ui.motionButton.classList.toggle('hidden',mode!=='settings');
 if(mode==='journal'){
  ui.infoTitle.textContent='📖 HÀNH TRÌNH CỦA MẸ';
  ui.infoBody.textContent='Trường học → Hành lang → Lớp học (25 lời chúc) → Ra khỏi trường → Lên xe → Đi xe về nhà → Tầng 1 gặp Bố → Cầu thang → Tầng 2 gặp Anh trai và Em trai → Lên tầng 3 → Cây điều ước.';
 }else if(mode==='achievement'){
  ui.infoTitle.textContent='🏆 THÀNH TÍCH';
  ui.infoBody.textContent='Đã đi '+(stage+1)+' / '+STAGES.length+' chặng. 25 tấm thiệp của học trò và '+TREE_WISHES.length+' bông hoa điều ước đang chờ mẹ!';
 }else{
  ui.infoTitle.textContent='⚙️ TÙY CHỈNH';
  ui.infoBody.textContent='Bạn có thể tắt hoặc bật hiệu ứng chuyển động. Game vẫn hoạt động bằng phím mũi tên, WASD, E hoặc các nút trên màn hình.';
 }
}
ui.achievement.addEventListener('click',()=>openInfo('achievement'));
ui.journal.addEventListener('click',()=>openInfo('journal'));
ui.settings.addEventListener('click',()=>openInfo('settings'));
ui.infoClose.addEventListener('click',dismissInfo);
ui.motionButton.addEventListener('click',()=>{
 reduceMotion=!reduceMotion;
 ui.motionButton.textContent=reduceMotion?'BẬT HIỆU ỨNG':'GIẢM CHUYỂN ĐỘNG';
});
let previousFrame=0;
function loop(now){
 requestAnimationFrame(loop);
 if(now-frameAt<28)return;
 const dt=Math.min(.05,previousFrame?(now-previousFrame)/1000:.03);
 frameAt=now;previousFrame=now;
 if(view==='map') {
  handleManualMove(...keyDirection(),dt);
  finishWalk(now);
  drawRpgOverworld(ctx,W,H,reduceMotion?0:now/1000,actor,vehicle,reduceMotion);
 }else{
  bloomHits=drawStoryLocation(ctx,W,H,SCENES[stage].id,
    reduceMotion?0:now/1000,selectedBloom,TREE_WISHES.length,reduceMotion);
 }
}

ui.loading.classList.add('done');
window.__APP_READY__=true;
setStage(0);
showDialogue(DIALOGUES.intro,7400);
requestAnimationFrame(loop);
