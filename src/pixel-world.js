import {heightAt} from './scene-layout.js';
// All scenery, people and vehicles are drawn from pixel primitives. No image assets.
const U=1672,V=941;
let g;
const scenes=new Map();
const c={ink:'#392f32',wood:'#95633e',light:'#ffe9ba',leaf:'#4e9955',dark:'#285a43',pink:'#efa7bd'};
const rect=(x,y,w,h,color)=>{g.fillStyle=color;g.fillRect(Math.round(x/2)*2,Math.round(y/2)*2,Math.ceil(w/2)*2,Math.ceil(h/2)*2);};
function poly(points,color){g.fillStyle=color;g.beginPath();points.forEach(([x,y],i)=>i?g.lineTo(x,y):g.moveTo(x,y));g.closePath();g.fill();}
function line(x,y,xx,yy,color,width=4){const n=Math.max(1,Math.ceil(Math.hypot(xx-x,yy-y)/3));for(let i=0;i<=n;i++)rect(x+(xx-x)*i/n-width/2,y+(yy-y)*i/n-width/2,width,width,color);}
function oval(x,y,rx,ry,color){for(let d=-ry;d<=ry;d+=4){const w=Math.sqrt(Math.max(0,1-d*d/(ry*ry)))*rx;rect(x-w,y+d,w*2,4,color);}}
function text(t,x,y,size=20,color=c.ink){g.fillStyle=color;g.font=`700 ${size}px "Be Vietnam Pro"`;g.textAlign='center';g.textBaseline='middle';g.fillText(t,x,y);}
function grain(x,y,w,h,seed=1,colors=['#d5a66b','#bb8952'],n=100){for(let i=0;i<n;i++){const a=((i*73+seed*37)%997)/997,b=((i*139+seed*11)%991)/991;rect(x+a*w,y+b*h,4+(i%4)*3,2,colors[i%colors.length]);}}
function flower(x,y,s=1,t=0,pink=true){const sway=Math.sin(t*.001+x)*s*2;line(x,y,x+sway,y-17*s,'#458752',2*s);for(const [dx,dy]of [[-5,0],[5,0],[0,-5],[0,5]])rect(x+sway+(dx-2)*s,y-19*s+dy*s,5*s,5*s,pink?'#f9a7ca':'#fff1b8');rect(x+sway-2*s,y-21*s,4*s,4*s,'#f4ca65');}
function foliage(x,y,r,t=0,pink=false){
 oval(x,y,r,r*.65,pink?'#ae587e':'#285a43');
 for(let i=0;i<55;i++){const a=i*2.399,rr=r*Math.sqrt((i+1)/56),xx=x+Math.cos(a)*rr,yy=y+Math.sin(a)*rr*.6;
  const col=pink?['#db7da7','#f5a9c9','#ffd3df']:['#438f54','#76af58','#b1ca68'];
  rect(xx+Math.sin(t*.0007+i)*1.5,yy,9+i%11,6+i%7,col[i%3]);
 }
}
function tree(x,y,s=1,t=0,pink=false){rect(x-9*s,y-126*s,18*s,126*s,'#795035');line(x,y-65*s,x-35*s,y-142*s,'#795035',10*s);line(x,y-85*s,x+39*s,y-157*s,'#795035',9*s);foliage(x,y-155*s,76*s,t,pink);line(x-5*s,y-111*s,x-5*s,y-15*s,'#b18b53',3*s);}
function windowAt(x,y,w,h){rect(x-5,y-5,w+10,h+10,'#8a593b');rect(x,y,w,h,'#73acbb');rect(x+5,y+5,w-10,h-10,'#a5d5d0');poly([[x+5,y+5],[x+w*.62,y+5],[x+5,y+h*.65]],'#d9eddf');rect(x+w/2-2,y,4,h,'#f9e3b6');rect(x,y+h/2-2,w,4,'#f9e3b6');rect(x-8,y+h,w+16,8,'#bb8955');}
function pot(x,y,s=1,t=0){poly([[x-19*s,y-29*s],[x+19*s,y-29*s],[x+13*s,y],[x-13*s,y]],'#bf7863');rect(x-22*s,y-32*s,44*s,7*s,'#e5a27e');for(let i=0;i<5;i++)flower(x+(i-2)*9*s,y-26*s,s,t,i%2===0);}
function woodFloor(top=.53){rect(0,V*top,U,V,'#d2a16b');for(let y=V*top;y<V;y+=26){rect(0,y,U,3,'#ab7649');for(let x=(Math.floor(y/26)%2)*110;x<U;x+=220)rect(x,y,3,26,'#b68650');}grain(0,V*top,U,V*(1-top),7,['#e7bf85','#b88750'],370);}
function pavement(top=.58){rect(0,V*top,U,V,'#bcb7a2');for(let y=V*top;y<V;y+=25){rect(0,y,U,3,'#8e9487');for(let x=(Math.floor(y/25)%2)*40;x<U;x+=80)rect(x,y,3,25,'#9da18f');}grain(0,V*top,U,V*(1-top),4,['#d7d0b7','#a4ab98'],250);}
function clouds(t=0){for(let i=0;i<7;i++){const x=((i*310-t*.013)%(U+300)+U+300)%(U+300)-180,y=70+(i%3)*65;for(const [dx,dy,w,h]of [[0,15,140,35],[26,0,90,50],[52,-12,45,15]])rect(x+dx,y+dy,w,h,'#fff3dd');rect(x+12,y+45,120,9,'#e5d1dc');}}
function sky(t){rect(0,0,U,V,'#75b9df');for(let y=0;y<470;y+=16)rect(0,y,U,16,['#79b8df','#8ac5e4','#a3d2e5','#c5dedc'][Math.min(3,Math.floor(y/120))]);oval(270,210,53,53,'#fff0bb');clouds(t);for(let i=0;i<12;i++)poly([[i*170-70,520],[i*170+130,290+(i%3)*48],[i*170+340,520]],i%2?'#669b8e':'#8fb9a0');}
function tiles(x,y,w,h){rect(x,y,w,h,'#b6654e');for(let yy=y;yy<y+h;yy+=10){rect(x,yy,w,3,'#e19c6a');for(let xx=x+(Math.floor(yy/10)%2)*12;xx<x+w;xx+=24)rect(xx,yy,3,10,'#8e4b43');}}
function fence(x,y,w,h=120){rect(x,y-h,w,7,'#31483e');rect(x,y-20,w,7,'#31483e');for(let xx=x;xx<x+w;xx+=18)rect(xx,y-h,5,h,'#31483e');}
function schoolBuilding(){rect(420,180,840,360,'#e5bb74');rect(454,215,772,315,'#f6d896');tiles(393,155,894,37);for(let floor=0;floor<3;floor++)for(let col=0;col<8;col++)windowAt(455+col*97,218+floor*99,50,62);rect(778,411,105,132,'#77513c');rect(790,420,80,123,'#38493f');rect(800,420,5,123,'#b58c59');for(let i=0;i<3;i++)rect(751-i*12,543+i*8,160+i*24,8,i%2?'#a19c8d':'#d1c9ab');}
function schoolGate(t){
 schoolBuilding();
 for(let i=0;i<7;i++)tree(55+i*255,570,.9,t,i===1||i===5);
 rect(0,640,590,60,'#d9c091');rect(1080,640,592,60,'#d9c091');fence(0,640,590,120);fence(1080,640,592,120);
 rect(570,295,48,420,'#efd29b');rect(1080,230,65,485,'#965044');poly([[570,355],[570,315],[590,285],[625,270],[1060,270],[1095,295],[1110,330],[1080,350],[1060,320],[630,320],[618,342],[618,355]],'#f3d99f');rect(630,320,430,8,'#c6a675');
 oval(1112,193,52,52,'#f6e9be');oval(1112,193,43,43,'#94b9bd');text('CCL',1112,195,20,'#345777');
 for(let i=0;i<10;i++){rect(589+i*51,224,3,62,'#826046');poly([[592+i*51,224],[628+i*51,231+Math.sin(t*.002+i)*3],[592+i*51,257]],['#e37e73','#efbf63','#91b58a','#ad9ebe'][i%4]);}
 // Gate leaves are separate objects, opening inward leaves the center aisle clear.
 poly([[617,500],[695,535],[695,691],[617,710]],'#42584b');for(let i=0;i<5;i++)line(624+i*14,508+i*7,624+i*14,701-i*3,'#9caa8e',4);
 poly([[995,535],[1078,500],[1078,710],[995,691]],'#42584b');for(let i=0;i<5;i++)line(1002+i*14,535-i*7,1002+i*14,691+i*3,'#9caa8e',4);
 rect(250,552,285,95,'#8b5146');text('TRƯỜNG THCS',392,579,21,'#ffe6a2');text('CÙ CHÍNH LAN',392,615,23,'#ffe6a2');
 pot(540,719,1.1,t);pot(1170,719,1.1,t);
}
function roomBase(){rect(0,0,U,550,'#e7cda0');for(let x=0;x<U;x+=132){rect(x,0,10,550,'#a77850');rect(x+10,0,4,550,'#f6dfb3');}rect(0,0,U,34,'#79543c');rect(0,500,U,34,'#89613e');woodFloor(.565);}
function door(x,y,w,h){rect(x-10,y-h-10,w+20,h+20,'#9a6b45');rect(x,y-h,w,h,'#37443c');poly([[x,y-h],[x+w*.23,y-h+13],[x+w*.23,y-10],[x,y]],'#be8653');poly([[x+w,y-h],[x+w*.78,y-h+13],[x+w*.78,y-10],[x+w,y]],'#be8653');}
function sofa(x,y,w){rect(x,y-105,w,88,'#946741');rect(x+12,y-92,w-24,62,'#ead1a0');for(let xx=x+20;xx<x+w-20;xx+=65){rect(xx,y-84,48,43,'#f5e0b6');flower(xx+24,y-47,.7,0);}rect(x+4,y-28,w-8,30,'#c99b62');rect(x,y-63,19,63,'#8a5d3c');rect(x+w-19,y-63,19,63,'#8a5d3c');rect(x+13,y,12,17,'#6f513a');rect(x+w-25,y,12,17,'#6f513a');}
function cabinet(x,y,w){rect(x,y-170,w,170,'#987044');for(let xx=x+10;xx<x+w;xx+=56){rect(xx,y-145,42,132,'#bb8e55');rect(xx+18,y-85,5,5,'#efd69a');}rect(x-8,y-180,w+16,12,'#d1a66d');}
function bookshelf(x,y,w){rect(x,y-270,w,270,'#89613e');for(let row=0;row<3;row++){rect(x+8,y-256+row*80,w-16,64,'#574c38');for(let i=0;i<Math.floor(w/17)-1;i++)rect(x+13+i*17,y-252+row*80+(i%3)*4,11,57-(i%3)*4,['#ba7173','#7e9b8b','#e6c489','#809bab'][i%4]);rect(x,y-185+row*80,w,7,'#c69b62');}}
function table(x,y,w=170){rect(x+12,y-6,9,63,'#875f3c');rect(x+w-20,y-6,9,63,'#875f3c');rect(x-5,y-25,w+10,26,'#bc874c');rect(x,y-24,w,7,'#e9bf7e');grain(x,y-19,w,15,8,['#d9ab68','#a67545'],18);}
function stairs(t=0,close=false){
 if(close){
  for(let i=0;i<15;i++){const x=520+i*52,y=858-i*39;poly([[x-74,y],[x+94,y],[x+94,y-24],[x-74,y-24]],'#b98350');rect(x-74,y-25,168,7,'#efd29b');rect(x-74,y+1,168,15,'#855f3e');}
  line(440,730,1310,180,'#77563b',13);line(440,722,1310,172,'#e1b77d',5);for(let i=0;i<13;i++)line(440+i*66,730-i*42,440+i*66,835-i*40,'#9c764b',6);
 }else{
  for(let i=0;i<12;i++){const x=1370+i*8,y=755-i*36;rect(x,y,190-i*4,33,'#a47445');rect(x,y,190-i*4,6,'#e4ba7d');}
  line(1355,653,1457,201,'#bd945e',12);for(let i=0;i<8;i++)line(1355+i*14,653-i*61,1355+i*14,750-i*54,'#7b593b',7);
 }
}
function human(a,t=0){
 const role=a.person??0,h=a.size,s=h/100,x=a.x,y=a.y,phase=(a.stride||0)/Math.max(1,h*.15),walk=a.walking,side=a.direction==='east'||a.direction==='west',back=a.direction==='north';
 const skin='#eec29e',hair=role===3?'#704b37':'#383137',shirt=role===0?'#eae1c6':role===1?'#455d78':'#f4f0df',pants=role===1?'#887f75':role===2?'#a5a7a8':'#5c555a';
 g.save();g.translate(x,y);if(a.direction==='west')g.scale(-1,1);
 oval(0,1,18*s,4*s,'#6e675044');
 const step=walk?Math.sin(phase):0;
 // Hips, knees, heels and hands are independently posed each frame.
 for(const sign of [-1,1]){
  const lift=walk?Math.max(0,step*sign)*7*s:0,fx=(sign*8+step*sign*10)*s,fy=-lift;
  line(sign*7*s,-34*s,fx,fy-5*s,role===0?'#e6c9a4':pants,9*s);rect(fx-7*s,fy-4*s,14*s,5*s,role===0?'#d6b47b':'#3a3739');
 }
 if(role===0){poly([[-16*s,-63*s],[15*s,-63*s],[(23+step*2)*s,-14*s],[(-23+step*2)*s,-14*s]],'#f7e9ca');rect(-17*s,-57*s,34*s,4*s,'#9c794b');line(-6*s,-49*s,-10*s,-19*s,'#ded0ae',2*s);line(8*s,-49*s,13*s,-19*s,'#fff5dc',2*s);for(let j=0;j<4;j++)rect((-8+j*5)*s,-22*s,2*s,2*s,'#cbbd9f');
  for(const sign of [-1,1]){poly([[sign*12*s,-65*s],[sign*21*s,-59*s],[sign*25*s,-23*s],[sign*12*s,-26*s]],'#6e939e');for(let j=0;j<5;j++)rect(sign*18*s-2*s,(-56+j*6)*s,4*s,3*s,'#eadac0');}
 }else{rect(-16*s,-64*s,32*s,36*s,shirt);rect(-2*s,-61*s,3*s,31*s,role===1?'#afbab6':'#e1dbc5');if(role===1){poly([[-10*s,-64*s],[0,-56*s],[10*s,-64*s]],'#a1b5bd');for(let yy=-54;yy<-32;yy+=7)rect(-7*s,yy*s,14*s,s,'#8ca4af');}else{line(-12*s,-35*s,12*s,-35*s,'#e6dfc9',2*s);}}
 for(const sign of [-1,1]){
  const swing=walk?-step*sign*.55:Math.sin(t*.004)*.07,raise=a.greeting&&sign===1?Math.sin(t*.007)*.55-.7:0;
  const ax=sign*18*s,ay=-59*s,ex=ax+Math.sin(swing+raise)*18*s,ey=ay+Math.cos(swing+raise)*24*s;
  line(ax,ay,ex,ey,shirt,9*s);oval(ex,ey,4*s,5*s,skin);
 }
 const hx=side?3*s:0;oval(hx,-80*s,23*s,23*s,hair);oval(hx+(side?5:0)*s,-77*s,18*s,19*s,skin);
 if(back){oval(0,-81*s,23*s,23*s,hair);if(role===0){rect(-23*s,-85*s,9*s,29*s,hair);rect(14*s,-85*s,10*s,29*s,hair);} }
 else{
  poly([[-21*s,-91*s],[-10*s,-104*s],[10*s,-100*s],[22*s,-91*s],[14*s,-85*s],[-5*s,-92*s]],hair);
  if(role===0){rect(-23*s,-88*s,8*s,29*s,hair);rect(16*s,-88*s,8*s,25*s,hair);oval(-20*s,-60*s,6*s,6*s,hair);oval(20*s,-63*s,6*s,6*s,hair);}
  if(role===3){line(-6*s,-99*s,1*s,-91*s,'#c48a4f',5*s);line(7*s,-99*s,14*s,-91*s,'#bd8246',4*s);}
  for(const e of side?[11]:[-8,9]){rect((hx/s+e)*s,-79*s,3*s,4*s,'#312c2d');rect((hx/s+e+1)*s,-79*s,s,s,'#fff2d1');}
  if(role===1||role===3){const col=role===1?'#c3ab78':'#302c31';for(const xx of [-14,3]){rect(xx*s,-83*s,13*s,2*s,col);rect(xx*s,-73*s,13*s,2*s,col);rect(xx*s,-83*s,2*s,12*s,col);rect((xx+11)*s,-83*s,2*s,12*s,col);}rect(-1*s,-80*s,5*s,2*s,col);}
  line(0,-67*s,7*s,-66*s,'#b36c66',2*s);
 }
 g.restore();
}
function student(x,y,size,t,index){human({x,y,size,person:2,direction:'south',walking:false,greeting:index%6===0},t+index*210);rect(x-size*.18,y-size*.65,size*.36,size*.08,'#b75c62');}
function vios(x,y,w,t=0,open=false,rear=false){
 const h=w*(rear?1.12:.40);g.save();g.translate(x,y);
 oval(0,0,w*.48,h*.08,'#4a534155');
 if(rear){poly([[-w*.39,-h*.90],[-w*.47,-h*.25],[-w*.43,0],[w*.43,0],[w*.47,-h*.25],[w*.39,-h*.90]],'#c5b596');rect(-w*.37,-h*.89,w*.74,h*.31,'#dfd0b3');poly([[-w*.35,-h*.57],[w*.35,-h*.57],[w*.42,-h*.34],[-w*.42,-h*.34]],'#465b60');rect(-w*.43,-h*.30,w*.86,h*.22,'#cabca0');rect(-w*.43,-h*.30,w*.18,h*.07,'#b75255');rect(w*.25,-h*.30,w*.18,h*.07,'#b75255');rect(-w*.16,-h*.17,w*.32,h*.075,'#fff2db');text('36A.21538',0,-h*.13,Math.max(8,w*.037),'#3a3833');rect(-w*.39,-h*.05,w*.78,h*.025,'#a89980');}
 else{
  for(const xx of [-w*.31,w*.32]){oval(xx,-h*.14,h*.20,h*.22,'#33373a');oval(xx,-h*.14,h*.12,h*.13,'#a9aaa0');for(let i=0;i<4;i++){const a=t*.009+i*Math.PI/4;line(xx-Math.cos(a)*h*.10,-h*.14-Math.sin(a)*h*.10,xx+Math.cos(a)*h*.10,-h*.14+Math.sin(a)*h*.10,'#d6d6be',3);}}
  poly([[-w*.49,-h*.28],[-w*.46,-h*.62],[-w*.28,-h*.69],[-w*.15,-h*.96],[w*.17,-h*.96],[w*.32,-h*.66],[w*.46,-h*.59],[w*.50,-h*.25]],'#caba9a');
  poly([[-w*.24,-h*.68],[-w*.12,-h*.88],[w*.14,-h*.88],[w*.27,-h*.68]],'#496067');line(-w*.01,-h*.88,-w*.01,-h*.66,'#a89c83',5);rect(-w*.44,-h*.35,w*.88,h*.04,'#ebddba');rect(w*.43,-h*.53,w*.06,h*.11,'#eee5c6');rect(-w*.48,-h*.54,w*.06,h*.13,'#ab5a55');
  for(const xx of [-w*.17,w*.10])rect(xx,-h*.61,w*.055,4,'#e8dec3');
  if(open){poly([[-w*.22,-h*.67],[-w*.02,-h*.67],[-w*.02,-h*.28],[-w*.22,-h*.28]],'#484844');poly([[-w*.22,-h*.67],[-w*.39,-h*.55],[-w*.39,-h*.15],[-w*.22,-h*.28]],'#c9b795');line(-w*.37,-h*.52,-w*.25,-h*.61,'#5d6b69',7);}
 }
 g.restore();
}
function newScene(id){
 const objects=[];const add=(kind,x,y,data={})=>objects.push({id:`${kind}-${objects.length}`,kind,x,y,...data});
 if(['school-front','school-exit','car-boarding'].includes(id))add('school',0,540);
 if(id==='school-hall')for(let i=0;i<4;i++){add('window',150+i*285,250,{w:160,h:180});if(i<3)add('pot',190+i*370,630,{s:1.4});} 
 if(id==='classroom'){
  add('board',490,380);add('teacher-desk',990,585);
  for(let row=0;row<5;row++)for(let col=0;col<5;col++){
   const x=100+col*163,y=580+row*70,s=.90+row*.045;
   add('pupil',x,y,{size:142*s,index:row*5+col});add('desk',x-58*s,y+8,{w:116*s});
  }
 }
 if(id==='floor1'){add('sofa',250,560,{w:380});add('table',300,655,{w:210});add('cabinet',990,529,{w:225});add('window',600,230,{w:200,h:210});add('stairs-small',0,745);add('pot',1180,553,{s:1.3});}
 if(id.startsWith('floor2')){add('bookshelf',690,470,{w:470});add('sofa',710,570,{w:420});add('window',210,200,{w:240,h:220});add('stairs-small',0,745);add('pot',1250,555,{s:1.2});}
 if(id==='stairs'){add('window',100,180,{w:280,h:350});add('stairs-close',0,940,{depth:0});}
 if(id==='wish-rooftop'){for(let i=0;i<5;i++)add('pot',150+i*320,770,{s:1.5});add('wish-tree',870,780);}
 return {id,objects};
}
function sceneFor(id){if(!scenes.has(id))scenes.set(id,newScene(id));return scenes.get(id);}
export function inspectWorld(id){const s=sceneFor(id);return {procedural:true,objects:s.objects.length,pupils:s.objects.filter(o=>o.kind==='pupil').length,imageAssets:0};}
export async function preparePixelWorld(){for(const id of ['flower-road','school-front','school-hall','classroom','school-exit','car-boarding','car-driving','home-front','floor1','floor2older','floor2younger','stairs','wish-rooftop'])sceneFor(id);}
function drawObject(o,t){const {kind,x,y}=o;
 if(kind==='school')schoolGate(t);
 if(kind==='window')windowAt(x,y,o.w,o.h);
 if(kind==='pot')pot(x,y,o.s,t);
 if(kind==='board'){rect(340,105,810,295,'#9b744c');rect(350,115,790,275,'#3c6555');rect(360,124,770,255,'#437361');text('CHÚC MỪNG NGÀY NHÀ GIÁO VIỆT NAM',745,176,25,'#f6edcb');text('20 · 11',745,246,48,'#f6edcb');rect(425,347,460,4,'#c6d1b6');}
 if(kind==='teacher-desk')table(x-120,y,240);
 if(kind==='desk')table(x,y,o.w);
 if(kind==='pupil')student(x,y,o.size,t,o.index);
 if(kind==='sofa')sofa(x,y,o.w);
 if(kind==='table')table(x,y,o.w);
 if(kind==='cabinet')cabinet(x,y,o.w);
 if(kind==='bookshelf')bookshelf(x,y,o.w);
 if(kind==='stairs-small')stairs(t,false);
 if(kind==='stairs-close')stairs(t,true);
 if(kind==='human')human(o,t);
 if(kind==='car')vios(x,y,o.w,o.moving?t:0,o.open,o.rear);
 if(kind==='wish-tree'){tree(x,y,2.7,t,true);oval(x,y,122,30,'#9c8c72');rect(x-120,y,240,43,'#bca784');rect(x-124,y,248,7,'#e0c89c');}
}
function background(id,t){
 if(['flower-road','school-front','school-exit','car-boarding','car-driving','home-front','wish-rooftop'].includes(id)){
  sky(t);
  if(id==='flower-road'){
   rect(0,520,U,421,'#69a05b');grain(0,520,U,210,4,['#a2c66d','#408659'],300);rect(0,735,U,100,'#e8c17f');
   for(let y=742;y<830;y+=23)for(let x=(Math.floor(y/23)%2)*30;x<U;x+=70){rect(x,y,63,19,'#f2d49d');rect(x+3,y+3,48,3,'#ffe7b4');}
   for(let i=0;i<180;i++){const x=i*47%U,y=i%2?710-(i*31%140):885+(i*17%55);flower(x,y,1.1+(i%3)*.3,t,i%3!==0);}
  }else if(id==='car-driving'){
   rect(0,610,U,100,'#b8b696');rect(0,710,U,231,'#737d7d');
   for(let i=0;i<12;i++){const x=((i*240-t*.08)%(U+300)+U+300)%(U+300)-160;rect(x,250+(i%3)*45,190,390,'#eed5ac');tiles(x-5,240+(i%3)*45,200,22);for(let yy=300;yy<600;yy+=110)windowAt(x+25,yy,100,62);}
   for(let i=0;i<16;i++)rect((i*140-t*.14%140+U)%U,840,70,6,'#f5e6b3');
  }else pavement(id==='wish-rooftop'?.78:.58);
  if(id==='home-front'){
   rect(480,80,625,660,'#e7cf9d');rect(482,80,32,660,'#a9674d');rect(1074,80,32,660,'#a9674d');
   for(let floor=0;floor<2;floor++){windowAt(570,135+floor*166,180,110);windowAt(825,135+floor*166,175,110);for(let xx=530;xx<1050;xx+=30)rect(xx,240+floor*165,4,70,'#7b8775');rect(520,300+floor*165,540,6,'#b29e71');}
   poly([[455,494],[1110,494],[1155,543],[420,543]],'#4c8b6e');rect(420,543,735,14,'#366d59');door(788,740,143,173);
   for(let y=744;y<850;y+=23)for(let x=480;x<1110;x+=35)rect(x,y,29,19,(x/35+y/23)%2<1?'#719980':'#d6d0ac');
   tree(1250,800,1.6,t);tree(350,800,1.2,t);pot(1130,799,1.2,t);
  }
  if(id==='wish-rooftop'){fence(0,790,U,150);}
 }else{
  roomBase();
  if(id==='school-hall'){for(let i=0;i<3;i++)door(1080+i*180,640,130,390);}
  if(id==='classroom'){for(let i=0;i<3;i++)windowAt(40+i*110,180,75,190);door(1480,640,150,410);}
 }
}
export function renderScene(ctx,W,H,id,actor,state){
 g=ctx;const t=state.clock||0;background(id,t);const list=[...sceneFor(id).objects];
 const person=(role,x,y,ratio=1)=>list.push({kind:'human',person:role,x:x*U,y:y*V,size:heightAt(id,y)*ratio,visible:true,walking:false,direction:'south',greeting:true});
 if(id==='floor1')person(1,.57,.79,1.08);
 if(id.startsWith('floor2')){person(2,.40,.78,1.12);person(3,.57,.78,1.10);}
 if(id==='car-driving')list.push({kind:'car',x:U*(.08+.84*state.progress),y:V*.93,w:450,moving:true});
 else{
  if(id==='car-boarding')list.push({kind:'car',x:U*.62,y:V*.94,w:490,open:state.moving&&state.progress>.25&&state.progress<.9});
  if(id==='home-front')list.push({kind:'car',x:U*.43,y:V*.935,w:215,rear:true});
  if(actor.visible&&!(id==='car-boarding'&&state.moving&&state.progress>.85))list.push({...actor,kind:'human'});
 }
 list.sort((a,b)=>(a.depth??a.y)-(b.depth??b.y)).forEach(o=>drawObject(o,t));
 const hits=[];
 if(id==='wish-rooftop')for(let i=0;i<24;i++){
  const a=i*2.39996,r=45+(i%6)*35,x=U*.52+Math.cos(a)*r,y=V*.4+Math.sin(a)*r*.66;
  hits.push({x,y,index:i});line(x,y,x,y+25,'#b89860',2);rect(x-9,y+20,18,24,state.selectedBloom===i?'#fff1b5':'#e7c67d');flower(x,y,1.4,t);
 }
 return hits;
}
