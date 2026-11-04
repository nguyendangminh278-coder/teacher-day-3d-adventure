import { CLASS_WISHES, TREE_WISHES, DIALOGUES } from './config.js';
import { loadIllustrations, renderScene } from './illustrated-scenes.js';
import {ROUTE_POINTS,onFloor,heightAt,sampleRoute} from './scene-layout.js';

const $=id=>document.getElementById(id);
const canvas=$('game'),ctx=canvas.getContext('2d',{alpha:false});
const W=1672,H=941;
const scene=(id,title,text,action,time,chapter,start,path,duration=2800,speaker=null)=>({id,title,text,action,time,chapter,start,path,duration,speaker});
// Each path is an actual action inside the current scene, before entering the next.
const scenes=[
 scene('school-front','Buổi sáng · Đến trường','Một ngày 20/11 bắt đầu trước cổng trường. Cùng mẹ bước vào nhé!','Bước qua cổng trường','07:00',0,[.50,.93,150],[[.50,.93,150],[.50,.70,120],[.52,.59,85]],3200),
 scene('school-hall','Đi qua hành lang','Theo mẹ qua hành lang, đi đến cửa lớp học.','Đi vào lớp học','07:10',0,[.28,.91,170],[[.28,.91,170],[.50,.70,130],[.77,.63,110]],3200),
 scene('classroom','Trong lớp · Những lời chúc','Học trò có 25 tấm thiệp dành tặng cô nhân ngày 20/11.','Đọc lời chúc của học trò','08:00',0,[.65,.73,220],[[.65,.73,220],[.78,.69,180],[.94,.62,140]],3000,DIALOGUES.classroom),
 scene('school-exit','Tan trường · Ra cổng','Giờ học đã kết thúc. Mẹ bước ra cổng để đến xe.','Đi ra điểm đón xe','11:30',1,[.52,.59,85],[[.52,.59,85],[.50,.69,120],[.69,.94,150]],3200,DIALOGUES.afterClass),
 scene('car-boarding','Bước lên xe','Xe đã chờ bên lề đường. Mẹ đi đến cửa, ngồi vào xe rồi về nhà.','Mở cửa và lên xe','11:40',1,[.21,.87,165],[[.21,.87,165],[.46,.87,165],[.56,.81,140]],3200),
 scene('car-driving','Chuyến xe về nhà','Xe đang đưa mẹ qua những con phố để trở về cùng gia đình.','Đang đi xe về nhà…','12:00',2,[.5,.8,1],[],6500),
 scene('home-front','Đã về đến nhà','Mẹ bước xuống xe và đi qua cửa nhà.','Bước vào nhà','12:15',3,[.65,.94,170],[[.65,.94,170],[.55,.85,145],[.51,.77,100]],3400,DIALOGUES.home),
 scene('floor1','Tầng 1 · Lời chúc của bố','Trong phòng khách, bố đang đợi để gửi mẹ một lời chúc.','Đi đến cầu thang','12:20',3,[.32,.92,230],[[.32,.92,230],[.66,.89,200],[.84,.78,175]],3200,DIALOGUES.father),
 scene('stairs','Cầu thang · Lên tầng 2','Mẹ bước lên từng bậc thang, đến với hai con.','Bước lên tầng 2','12:25',3,[.23,.94,150],[[.23,.94,150],[.39,.65,140],[.58,.28,115]],4000),
 scene('floor2older','Tầng 2 · Lời chúc của anh trai','Anh trai gửi mẹ lời chúc từ trái tim.','Đến bên em trai','12:30',3,[.74,.92,230],[[.74,.92,230],[.65,.88,220]],2400,DIALOGUES.olderBrother),
 scene('floor2younger','Tầng 2 · Lời chúc của em trai','Em trai cũng có điều muốn nói với mẹ.','Đi lên tầng cao nhất','12:35',3,[.65,.88,220],[[.65,.88,220],[.81,.81,190],[.88,.62,150]],3000,DIALOGUES.youngerBrother),
 scene('stairs','Cầu thang · Lên tầng 3','Điều bất ngờ cuối cùng đang ở tầng trên cùng.','Bước lên sân thượng','12:40',4,[.23,.94,150],[[.23,.94,150],[.39,.65,140],[.58,.28,115]],4000,DIALOGUES.upstairs),
 scene('wish-rooftop','Tầng 3 · Cây điều ước','Mỗi bông hoa là một điều ước dành riêng cho mẹ.','Đọc những điều ước','12:45',4,[.25,.91,160],[],0,DIALOGUES.finale),
];
for(const [i,points] of Object.entries(ROUTE_POINTS)){
 const s=scenes[Number(i)];s.path=points.map(([x,y])=>[x,y,heightAt(s.id,y)]);s.start=s.path[0];
}
let stage=0,actor={},motion=null,loaded=false,paused=false,clock=0,prev=0,bloomHits=[];
let selectedBloom=-1,classRead=false,calm=false;
const keys=new Set();
const chapters=['Trường học','Tan trường','Về bằng xe','Ngôi nhà','Cây điều ước'];
$('stageTotal').textContent=scenes.length;
$('timeline').replaceChildren(...chapters.map((name,i)=>{const li=document.createElement('li');li.innerHTML=`<span>${i+1}</span><strong></strong>`;li.querySelector('strong').textContent=name;return li;}));
for(const [i,wish] of CLASS_WISHES.entries()){
 const e=document.createElement('article');e.className='wish-card';e.textContent=`${String(i+1).padStart(2,'0')} · ${wish}`;$('classWishes').append(e);
}
function resize(){
 const k=Math.min(innerWidth/W,innerHeight/H);
 canvas.width=W;canvas.height=H;ctx.imageSmoothingEnabled=true;
 Object.assign(canvas.style,{width:W*k+'px',height:H*k+'px',left:(innerWidth-W*k)/2+'px',top:(innerHeight-H*k)/2+'px'});
}
window.addEventListener('resize',resize);resize();
function blocked(){return !$('infoPanel').hidden||!$('classroomPanel').hidden;}
function update(){
 const s=scenes[stage];
 $('stageNumber').textContent=stage+1;$('objectiveTitle').textContent=s.title;$('objectiveText').textContent=s.text;
 $('sceneTitle').textContent=stage===0?'Trường THCS Cù Chính Lan':s.title;$('sceneTime').textContent=s.time;$('actionLabel').textContent=motion?'Mẹ đang di chuyển…':s.action;
 $('actionBtn').disabled=!!motion||!loaded||blocked()||stage===5;
 $('actionBtn').hidden=stage===12;
 $('controlsPanel').hidden=stage===5||stage===12;
 $('progressFill').style.width=((stage+1)/scenes.length*100)+'%';
 [...$('timeline').children].forEach((li,i)=>{li.className=i<s.chapter?'done':i===s.chapter?'current':'';li.setAttribute('aria-current',i===s.chapter?'step':'false');});
 $('finalPanel').hidden=stage!==12;
 $('dialogue').hidden=!s.speaker||stage===12;
 if(s.speaker){$('dialogueName').textContent=s.speaker.name;$('dialogueText').textContent=s.speaker.text;}
 document.body.dataset.scene=s.id;
}
function enter(n){
 stage=n;motion=null;const [x,y,size]=scenes[n].start;
 actor={x:x*W,y:y*H,size,walking:false,direction:'south',visible:true};
 if(n===5)motion={elapsed:0,duration:scenes[n].duration,driving:true};
 update();
}
function beginAction(){
 if(!loaded||motion||blocked()||stage===12)return;
 if(stage===2&&!classRead){$('classroomPanel').hidden=false;update();$('dismissClass').focus();return;}
 if(stage===5)return;
 motion={elapsed:0,duration:calm?Math.min(1800,scenes[stage].duration):scenes[stage].duration,path:[[actor.x/W,actor.y/H,actor.size],...scenes[stage].path.slice(1)]};
 actor.walking=true;keys.clear();update();
}
$('actionBtn').addEventListener('click',beginAction);
$('dismissClass').addEventListener('click',()=>{classRead=true;$('classroomPanel').hidden=true;beginAction();});
function openInfo(mode){
 $('infoPanel').hidden=false;$('motionButton').hidden=mode!=='settings';
 if(mode==='journal'){
  $('infoTitle').textContent='Nhật ký hành trình';
  $('infoBody').textContent=scenes.slice(0,stage+1).map(s=>s.time+' · '+s.title).join('\n\n');
 }else if(mode==='wishes'){
  $('infoTitle').textContent='24 điều ước dành cho mẹ';$('infoBody').textContent=TREE_WISHES.map((w,i)=>(i+1)+'. '+w).join('\n\n');
 }else if(mode==='achievement'){
  $('infoTitle').textContent='Những yêu thương đã nhận';$('infoBody').textContent=`Đã đến ${stage+1} / ${scenes.length} chặng.\n\n${classRead?'Đã nhận 25 lời chúc của học trò.':'Những lời chúc của học trò đang chờ mẹ.'}\n\n${stage===12?'Đã đến cây điều ước trên tầng cao nhất.':'Cây điều ước chờ ở tầng 3 của ngôi nhà.'}`;
 }else{
  $('infoTitle').textContent='Cài đặt';$('infoBody').textContent='Không có chớp sáng hay hiệu ứng nhấp nháy. Nhân vật vẫn thực hiện các hành động bước vào cửa, lên xe và leo cầu thang. Chọn chuyển động ngắn hơn nếu muốn.';
 }
 keys.clear();update();$('infoClose').focus();
}
function closeInfo(){ $('infoPanel').hidden=true;update(); }
$('infoClose').addEventListener('click',closeInfo);
$('journalBtn').addEventListener('click',()=>openInfo('journal'));
$('settingsBtn').addEventListener('click',()=>openInfo('settings'));
$('achievementBtn').addEventListener('click',()=>openInfo('achievement'));
$('allWishesBtn').addEventListener('click',()=>openInfo('wishes'));
$('motionButton').addEventListener('click',()=>{calm=!calm;$('motionButton').textContent=calm?'Dùng thời lượng thông thường':'Rút ngắn chuyển động';});
$('replayBtn').addEventListener('click',()=>{classRead=false;selectedBloom=-1;clock=0;enter(0);});
window.addEventListener('keydown',e=>{
 const k=e.key.toLowerCase();
 if(['arrowup','arrowdown','arrowleft','arrowright',' ','e','enter'].includes(k))e.preventDefault();
 if(k==='escape'){
  if(!$('infoPanel').hidden)closeInfo();
  else if(!$('classroomPanel').hidden){$('classroomPanel').hidden=true;update();}
  return;
 }
 if(blocked())return;
 if(['arrowup','arrowdown','arrowleft','arrowright','w','a','s','d'].includes(k))keys.add(k);
 if(!e.repeat&&['e','enter',' '].includes(k))beginAction();
});
window.addEventListener('keyup',e=>keys.delete(e.key.toLowerCase()));
window.addEventListener('blur',()=>{keys.clear();paused=true;});
window.addEventListener('focus',()=>{paused=false;prev=0;});
for(const b of document.querySelectorAll('[data-move]')){
 const key=b.dataset.move;
 b.addEventListener('pointerdown',e=>{e.preventDefault();keys.add(key);b.setPointerCapture(e.pointerId);});
 for(const event of ['pointerup','pointercancel','lostpointercapture'])b.addEventListener(event,()=>keys.delete(key));
}
$('enterBtn').addEventListener('click',beginAction);
canvas.addEventListener('pointerdown',e=>{
 if(stage!==12||blocked())return;
 const r=canvas.getBoundingClientRect(),x=(e.clientX-r.left)/r.width*W,y=(e.clientY-r.top)/r.height*H;
 const nearest=bloomHits.reduce((best,h)=>Math.hypot(h.x-x,h.y-y)<Math.hypot(best.x-x,best.y-y)?h:best,{x:Infinity,y:Infinity});
 if(Math.hypot(nearest.x-x,nearest.y-y)<48){selectedBloom=nearest.index;$('treeWish').textContent=TREE_WISHES[selectedBloom];}
});
function followPath(path,t){
 const p=sampleRoute(path,t);
 actor.x=p.x*W;actor.y=p.y*H;actor.size=heightAt(scenes[stage].id,p.y);
 actor.direction=Math.abs(p.dx)*W>Math.abs(p.dy)*H?(p.dx>0?'east':'west'):(p.dy>0?'south':'north');
}
function frame(now){
 requestAnimationFrame(frame);
 const dt=prev?Math.min(50,now-prev):0;prev=now;
 if(!paused&&!blocked()){
  clock+=dt;
  if(motion){
   motion.elapsed=Math.min(motion.duration,motion.elapsed+dt);
   if(motion.path?.length>1)followPath(motion.path,motion.elapsed/motion.duration);
   if(motion.elapsed>=motion.duration){enter(stage+1);}
  }else if(stage!==12){
   const dx=Number(keys.has('arrowright')||keys.has('d'))-Number(keys.has('arrowleft')||keys.has('a'));
   const dy=Number(keys.has('arrowdown')||keys.has('s'))-Number(keys.has('arrowup')||keys.has('w'));
   actor.walking=!!(dx||dy);
   if(actor.walking){
    actor.direction=dx>0?'east':dx<0?'west':dy<0?'north':'south';
    const nx=actor.x+dx*dt*.22,ny=actor.y+dy*dt*.22;
    if(onFloor(scenes[stage].id,nx/W,ny/H)){actor.x=nx;actor.y=ny;actor.size=heightAt(scenes[stage].id,ny/H);}
   }
  }
 }
 const progress=motion?motion.elapsed/motion.duration:0;
 bloomHits=renderScene(ctx,W,H,scenes[stage].id,actor,{clock,progress,moving:!!motion,selectedBloom,calm,stage});
 if(location.search.includes('qa=1'))window.__STORY_STATE__={stage,scene:scenes[stage].id,moving:!!motion,progress,actor:{...actor},spriteFrame:Math.floor(clock/130)%4};
}
try{
 await Promise.all([loadIllustrations(),document.fonts.ready]);loaded=true;$('loading').hidden=true;enter(0);requestAnimationFrame(frame);
}catch(e){$('loadingText').textContent=e.message;$('retryBtn').hidden=false;}
$('retryBtn').addEventListener('click',()=>location.reload());
