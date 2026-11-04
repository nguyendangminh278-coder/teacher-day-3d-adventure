/**
 * Fine-pixel RPG scenery for the 20/11 journey.
 * Procedurally rasterized at 768px wide (1–3px texture clusters), cached by scene.
 * Original artwork; no image downloads, WebGL, canvas smoothing, or 3D assets.
 */
const PAL = {
  sky: ['#2657c8','#346ed0','#4a8bda','#70ade4','#b2d8db'],
  light:'#f6edd3', ink:'#3f384c', bark:'#755052', bark2:'#a4775b',
  leafDark:'#347b59',leafMid:'#50966b',leafLight:'#7bb55a',leafHi:'#b3ce68',
  grass:'#78b751',grass2:'#91c65a',grassHi:'#b0d46e',
  sea:'#3f9cb5',water:'#287ba9',foam:'#c1f3f1',
  rose:'#ed839d',roseDark:'#d76688',gold:'#f9cb78',
  wall:'#f3d4a4',stone:'#968c83',stoneHi:'#c8bda2',
  roof:'#af6c52',roofHi:'#d49567'
};
const caches = new Map();
let g, seed=1234;
function rnd(){seed=(Math.imul(seed,1664525)+1013904223)>>>0;return seed/4294967296;}
function rr(a,b){return a+(b-a)*rnd();}
function pi(x){return Math.round(x);}
function p(x,y,w,h,color){if(w<=0||h<=0)return;g.fillStyle=color;g.fillRect(pi(x),pi(y),Math.ceil(w),Math.ceil(h));}
function ell(x,y,rx,ry,color,step=2){
 for(let dy=-ry;dy<=ry;dy+=step){const v=1-dy*dy/(ry*ry),dx=Math.sqrt(Math.max(0,v))*rx;p(x-dx,y+dy,dx*2,step,color);}
}
function stroke(x1,y1,x2,y2,color,width=2){
 const d=Math.max(Math.abs(x2-x1),Math.abs(y2-y1));
 for(let i=0;i<=d;i+=Math.max(1,width)){const a=i/Math.max(1,d);p(x1+(x2-x1)*a,y1+(y2-y1)*a,width,width,color);}
}
function roof(cx,top,width,height){
 // Tiled trapezoidal roof; tiny individual shingles rather than flat trapezoids.
 for(let row=0;row<height;row+=2){
   const ext=width*.48*(row/height);
   const left=cx-ext,right=cx+ext;
   p(left,top+row,right-left,2,row%6===0?'#8e554e':row%4===0?PAL.roofHi:PAL.roof);
   if(row>6&&row%5<3)for(let col=left+((row*7)%13);col<right;col+=12)
     p(col,top+row,rr(3,8),1,row%9===0?'#e6af75':'#855046');
 }
 p(cx-width*.52,top+height-2,width*1.04,5,'#704b51');
}
function windowBox(x,y,w,h){
 p(x-3,y-3,w+6,h+6,'#644957');p(x,y,w,h,'#5397ad');
 p(x+2,y+3,w-4,h-6,'#a8d6d6');p(x+w*.48,y,3,h,'#e9d9ac');
 p(x,y+h*.48,w,3,'#e9d9ac');p(x-6,y+h,w+12,5,'#85665e');
 for(let i=0;i<4;i++){const col=['#f7a0a0','#e8cf6e','#db86a6','#fff1c1'][i];flower(x+(i+1)*w/5,y+h+5,1,col);}
}
function flower(x,y,s=1,petal='#ef9ba2'){
 p(x-1*s,y,2*s,9*s,'#397b57');p(x-4*s,y+4*s,4*s,2*s,'#6faa59');
 for(const [dx,dy] of [[-3,-3],[2,-3],[-3,2],[2,2],[0,-5]])p(x+dx*s,y+dy*s,3*s,3*s,petal);
 p(x,y,2*s,2*s,'#ffdf88');
}
function foliage(cx,cy,rx,ry,palette=['#357e5d','#539768','#8bbb62','#bfce70'],detail=1){
 ell(cx+1,cy+6,rx,ry,palette[0],2);
 // Offset overlapping canopy clumps give the silhouette a lumpy, organic edge.
 for(let i=0;i<10;i++){const a=i*2.399,dx=Math.cos(a)*rx*.68,dy=Math.sin(a)*ry*.67;
   ell(cx+dx,cy+dy,rx*.35,ry*.28,i%3===0?palette[0]:palette[1],2);
 }
 for(let k=0;k<rx*ry*.18*detail;k++){
   const xx=rr(-rx,rx),yy=rr(-ry,ry);
   if((xx*xx)/(rx*rx)+(yy*yy)/(ry*ry)>1)continue;
   const c=yy<0?(rnd()<.45?palette[3]:palette[2]):rnd()<.25?palette[2]:palette[1];
   p(cx+xx,cy+yy,rr(1,3),rr(1,3),c);
 }
}
function oak(x,ground,s=1,autumn=false) {
 const trunkH=84*s, tw=15*s,py=ground-trunkH;
 p(x-tw*.55,py,tw,trunkH,PAL.bark);
 p(x-tw*.35,py+9*s,tw*.33,trunkH-9*s,PAL.bark2);
 stroke(x-3*s,py+36*s,x-31*s,py-3*s,PAL.bark,7*s);
 stroke(x+4*s,py+26*s,x+30*s,py-16*s,PAL.bark,6*s);
 stroke(x-3*s,py+8*s,x-18*s,py-20*s,PAL.bark,5*s);
 for(let i=0;i<23;i++){const bx=x+rr(-6,6)*s,by=py+rr(20,76)*s;p(bx,by,rr(1,2)*s,rr(3,9)*s,rnd()<.5?'#c49066':'#5b4450');}
 const palette=autumn?['#88744c','#aa8c51','#d2ab67','#eed081']:
 ['#2b7258','#397f58','#68a95d','#a3c966'];
 foliage(x,py-26*s,51*s,36*s,palette,.75);
 foliage(x-24*s,py-17*s,35*s,27*s,palette,.55);
 foliage(x+27*s,py-31*s,38*s,30*s,palette,.65);
 for(let i=0;i<10;i++)p(x+rr(-trunkH*.4,trunkH*.4),ground+rr(-3,4),rr(2,5),rr(1,3),'#bfd16b');
}
function pine(x,ground,s=1){
 p(x-3*s,ground-110*s,6*s,111*s,'#685253');
 for(let layer=0;layer<5;layer++){
   const yy=ground-(105-layer*18)*s,w=(15+layer*8)*s;
   for(let dy=0;dy<26*s;dy+=2*s){
     const ww=w*(dy/(26*s));
     p(x-ww,yy+dy,ww*2,2*s,layer%2?'#2d7967':'#24685e');
   }
   for(let i=0;i<19;i++)p(x+rr(-w,w),yy+rr(11,27)*s,rr(1,3)*s,rr(2,4)*s,rnd()<.5?'#42967a':'#79ae78');
 }
}
function bush(x,y,s=1){
 foliage(x,y-10*s,26*s,18*s,['#2d785e','#458c63','#7eb45f','#bbd075'],.45);
 for(let i=0;i<8;i++){const bx=x+rr(-20,20)*s;flower(bx,y-5*s+rr(-8,8)*s,s*.7,i%2?PAL.rose:'#f5ddb2');}
}
function cloud(x,y,s=1){
 ell(x,y,36*s,11*s,'#e5f1ed',3);
 ell(x-14*s,y-8*s,25*s,14*s,'#f1f5ed',2);
 ell(x+12*s,y-10*s,23*s,16*s,'#fff5e5',2);
 ell(x+2*s,y-16*s,17*s,13*s,'#fff9ea',2);
 p(x-32*s,y+6*s,63*s,2*s,'#afdae1');
}
function sky(H,y){
 const h=Math.max(1,y);
 const bands=PAL.sky;
 for(let i=0;i<bands.length;i++)p(0,h*i/bands.length,768,h/bands.length+2,bands[i]);
 for(let i=0;i<11;i++){const x=(i*149+41)%850-35,yy=28+(i%4)*29;cloud(x,yy,.45+(i%3)*.18);}
 for(let i=0;i<16;i++){const xx=i*53,hh=35+(i%4)*13;
 p(xx-10,y-hh,68,hh,'#669f9f');p(xx+7,y-hh-10,32,12,'#669f9f');}
}
function meadow(H,y) {
 p(0,y,768,H-y,'#6da64e');p(0,y+6,768,H-y-6,'#7db451');
 for(let i=0;i<2500;i++){
   const x=rr(0,768),yy=rr(y+3,H);
   p(x,yy,rr(1,3),rr(1,3),rnd()<.4?'#a5c962':rnd()<.5?'#4b994c':'#8dbd56');
   if(i%13===0)stroke(x,yy,x+rr(-2,2),yy-rr(3,7),'#afcc6b',1);
 }
 for(let i=0;i<120;i++){const x=rr(0,768),yy=rr(y+9,H),col=['#fff1c9','#f2a3b9','#e1c9f1','#f8d875'][i%4];flower(x,yy,rr(.45,.85),col);}
}
function stone(x,y,rx,ry){
 ell(x,y,rx,ry,'#777a78',2);
 ell(x-3,y-4,rx*.82,ry*.75,'#a2a39a',2);
 for(let i=0;i<12;i++)p(x+rr(-rx*.7,rx*.7),y+rr(-ry*.5,ry*.5),rr(1,4),rr(1,3),i%3?'#c9ba9d':'#6e7670');
}
function path(y,farX=384,nearX=390){
 for(let py=y-9;py<520;py+=3){
   const t=(py-y+10)/(520-y+10),cx=farX+(nearX-farX)*t+Math.sin(t*5)*12*t,wide=11+185*t*t;
   p(cx-wide,py,wide*2,3,py%9===0?'#b48b68':'#b98c62');
   for(let i=0;i<Math.round(wide/19)+1;i++){
     const tx=cx-wide+((i*47+py*7)%Math.max(5,wide*2));
     p(tx,py,rr(3,7)*Math.max(.5,t),2,'#ddbd89');
   }
 }
 for(let k=0;k<100;k++){
   const t=rnd(),yy=y+14+t*(470-y),cx=farX+(nearX-farX)*t+Math.sin(t*5)*12*t,wide=12+185*t*t;
   stone(cx+rr(-wide,wide),yy,rr(2,7),rr(1,3));
 }
}
function forestBack(y,stage){
 for(let i=0;i<22;i++){const x=(i*54+12)%820-30,depth=i%4;
  if(i%4===0)pine(x,y+3,(.55+depth*.06));
  else oak(x,y+2,.37+(depth*.045),i%7===0);
 }
}
function fence(x,y,count,spacing=28){
 for(let i=0;i<count;i++) {
   const xx=x+i*spacing; p(xx-2,y-25,5,30,'#865e53');p(xx-3,y-29,7,6,'#bb9469');
   if(i<count-1){p(xx+3,y-20,spacing-5,4,'#bb9469');p(xx+3,y-10,spacing-5,4,'#885b55');}
 }
}
function cottage(x,ground,s=1) {
 // Grounded cozy wooden/stone home. Tiny roof tiles, wall timber, shutter panes.
 const pw=195*s,wallH=79*s,roofTop=ground-156*s;
 p(x-pw*.5,ground-wallH,pw,wallH,PAL.wall);
 for(let i=0;i<330;i++){const xx=x+rr(-pw*.48,pw*.48),yy=ground-rr(1,wallH);p(xx,yy,rr(1,4)*s,rr(1,2)*s,rnd()<.5?'#e3b98b':'#fff0cd');}
 for(const xx of [-75,-24,42,88])p(x+xx*s,ground-80*s,5*s,80*s,'#8b665e');
 p(x-pw*.5,ground-81*s,pw,5*s,'#80595b');
 roof(x,roofTop,236*s,71*s);
 // Dormer.
 p(x-18*s,roofTop+29*s,35*s,26*s,'#d7b084');
 roof(x,roofTop+17*s,50*s,17*s);
 windowBox(x-12*s,roofTop+34*s,23*s,15*s);
 windowBox(x-82*s,ground-63*s,31*s,29*s);
 windowBox(x+49*s,ground-63*s,31*s,29*s);
 p(x-19*s,ground-50*s,39*s,50*s,'#694a50');
 p(x-14*s,ground-48*s,30*s,47*s,'#9b6952');
 p(x+9*s,ground-27*s,3*s,3*s,PAL.gold);
 p(x-22*s,ground-2*s,48*s,5*s,'#c9b390');
 p(x-29*s,ground+3*s,60*s,6*s,'#9f9981');
 for(let i=0;i<6;i++)p(x-85*s+(i*30*s),ground-76*s,8*s,3*s,'#f6d4b0');
 bush(x-106*s,ground+4*s,.75*s);bush(x+101*s,ground+3*s,.8*s);
}
function windmill(x,ground,s=1,angle=0){
 const top=ground-161*s;
 p(x-32*s,ground-110*s,65*s,110*s,'#d2bd95');
 for(let i=0;i<100;i++){const tx=x+rr(-30,30)*s,ty=ground-rr(8,109)*s;p(tx,ty,rr(2,5)*s,rr(1,2)*s,'#aa957e');}
 roof(x,top,78*s,43*s);
 p(x-31*s,ground-118*s,62*s,6*s,'#805851');
 p(x-17*s,ground-58*s,34*s,58*s,'#8b624f');
 p(x-12*s,ground-52*s,24*s,52*s,'#b27e58');
 p(x-4*s,ground-28*s,3*s,3*s,'#ffcf75');
 windowBox(x-11*s,ground-100*s,22*s,19*s);
 // Windmill hub & cross are drawn on the dynamic layer.
 return {x:x,y:ground-116*s,s,angle};
}
function school(x,ground,s=1) {
 const w=330*s,h=153*s;
 p(x-w*.5,ground-h,w,h,'#f4c49c');
 for(let i=0;i<650;i++)p(x+rr(-w*.48,w*.48),ground-rr(3,h),rr(1,2)*s,rr(1,2)*s,'#ffe1bb');
 p(x-w*.5-8*s,ground-h-13*s,w+16*s,16*s,'#bf6d69');
 p(x-w*.5-3*s,ground-h-19*s,w+6*s,8*s,'#e6a072');
 p(x-w*.5,ground-26*s,w,5*s,'#e9b786');
 for(let i=0;i<7;i++) {
   const wx=x-w*.45+i*w*.15-11*s;
   windowBox(wx,ground-h+25*s,27*s,34*s);
 }
 for(let i=0;i<5;i++){
   const wx=x-w*.4+i*w*.2-13*s;
   if(i!==2)windowBox(wx,ground-78*s,31*s,42*s);
 }
 p(x-23*s,ground-67*s,46*s,67*s,'#67556b');
 p(x-17*s,ground-62*s,34*s,62*s,'#9bc8c3');
 p(x-2*s,ground-62*s,4*s,62*s,'#f7d7b4');
 p(x-32*s,ground-152*s,65*s,19*s,'#fff2da');
 label('20/11',x,ground-142*s,16*s,'#a15d74');
 p(x-w*.5-6*s,ground-5*s,w+12*s,5*s,'#c9a28a');
}
function label(text,x,y,size,color) {
 g.textAlign='center';g.textBaseline='middle';
 g.font='bold '+Math.max(8,pi(size))+'px monospace';g.fillStyle='#5c4b58';
 g.fillText(text,pi(x+1),pi(y+1));g.fillStyle=color;g.fillText(text,pi(x),pi(y));
}
function portal(x,y){
 ell(x,y,59,87,'#644f89',4);ell(x,y,51,80,'#a27bc8',3);ell(x,y,44,73,'#f0b4d7',2);
 ell(x,y,37,65,'#6e85b8',2);ell(x,y,29,56,'#809fcb',2);
 for(let i=0;i<85;i++){
   const a=rr(0,Math.PI*2),r=rr(40,75);
   p(x+Math.sin(a)*r,y+Math.cos(a)*r*1.2,rr(1,3),rr(1,3),rnd()<.5?'#ffe7b7':'#e7c3e3');
 }
}
function river(x,y){
 // small waterway with layered pixel shore.
 for(let py=y-15;py<520;py+=3){const t=(py-y+15)/(520-y+15),cx=x+Math.sin(t*8)*27;
  p(cx-11-25*t,py,22+50*t,3,py%9?'#398bb5':'#5baaca');
  if(py%6===0)for(let j=0;j<3;j++)p(cx+rr(-15,15),py,rr(3,9),1,'#b6e1e1');
 }
 for(let i=0;i<11;i++){const t=i/11,py=y+17+t*180,cx=x+Math.sin(t*8)*27;stone(cx+(i%2?26:-27),py,rr(7,13),rr(4,8));}
}
function notice(x,y,text){
 p(x-84,y-20,168,37,'#8c645a');p(x-80,y-16,160,29,'#fff0c9');
 label(text,x,y,12,'#90516c');
 p(x-57,y+17,5,13,'#8d645a');p(x+53,y+17,5,13,'#8d645a');
}
function homeRoom(H,y,stage){
 p(0,0,768,H,'#e5c29e');
 p(0,0,768,y-48,'#f8e3bc');
 p(0,y-51,768,8,'#9d7472');
 for(let i=0;i<18;i++)p(i*48,y-43,40,3,'#f4d9bb');
 p(0,y-43,768,H-y+43,'#b78a70');
 for(let row=0;row<13;row++)for(let col=0;col<22;col++){
   p(col*38+((row%2)*19),y-28+row*17,36,2,row%2?'#9c746c':'#d0a583');
   p(col*38,y-26+row*17,1,17,'#a87769');
 }
 p(68,y-280,165,171,'#80656b');
 p(74,y-273,153,158,'#b7dee4');
 p(150,y-273,5,158,'#f5e3b7');p(74,y-196,153,5,'#f5e3b7');
 cloud(155,y-225,.75);
 // Checked curtain and planters.
 p(69,y-280,15,154,'#f2b6a8');p(213,y-280,15,154,'#f2b6a8');
 for(let i=0;i<12;i++){p(69,y-270+i*12,15,2,'#fff0cc');p(213,y-270+i*12,15,2,'#fff0cc');}
 // Shelves with books.
 p(560,y-290,155,12,'#846359');p(563,y-216,150,10,'#846359');
 for(let i=0;i<14;i++){
   const x=565+i*10,yy=y-288;
   p(x,yy-rr(13,37),7,rr(16,29),['#82a6a0','#b57e8f','#e2b76b','#8e94b1'][i%4]);
 }
 for(let i=0;i<8;i++)p(566+i*18,y-247,13,30,['#ba8d69','#a06e70','#e7af80'][i%3]);
 // Rug.
 ell(388,y+32,190,38,'#916a78',4);ell(388,y+30,171,29,'#e8cbaa',3);
 ell(388,y+30,142,18,'#c58f81',2);
 // Family couch.
 p(52,y-112,161,76,'#a87678');p(62,y-118,142,60,'#ce9b8e');
 p(67,y-121,57,56,'#dbb3a3');p(141,y-121,57,56,'#e2b7a8');
 p(53,y-37,159,11,'#825e60');p(67,y-25,8,23,'#745559');p(187,y-25,8,23,'#745559');
 // Ceiling lamp.
 p(379,0,6,30,'#866b62');ell(382,32,25,11,'#f4e1aa',2);p(365,31,34,4,'#c99f77');
 bush(732,y-28,.85);
 p(313,y-45,143,13,'#986f62');p(325,y-32,7,27,'#755658');p(435,y-32,7,27,'#755658');
 if(stage!==6){
   // Bedside bookshelf / children's room toys.
   p(483,y-110,70,64,'#896b64');p(488,y-104,60,15,'#dfbb90');
   p(488,y-85,60,12,'#bcdcb6');p(488,y-68,60,13,'#edc1a6');
   for(let i=0;i<13;i++)p(490+i*4,y-87-rr(5,21),3,rr(13,17),['#83aaad','#f3d091','#b393b6'][i%3]);
   label('GIA ĐÌNH LÀ NHÀ',380,y-290,19,'#ad6984');
 }else{ label('CHÀO MẸ VỀ NHÀ',380,y-290,19,'#ad6984'); }
}
function mother(x,feet,s,t,walk=false){sprite(x,feet,s,t,'mother',walk);}
function sprite(x,feet,s,t,who='mother',walk=false){
 const X=x-14*s,Y=feet-57*s,face='#f1bb98',hair=who==='dad'?'#524653':'#44354b';
 const shirt=who==='mother'?'#7abec5':who==='dad'?'#6787ad':who==='older'?'#90b68b':'#d99a79';
 const trim=who==='mother'?'#b9e5d4':who==='dad'?'#a2b5c8':who==='older'?'#d6e4b0':'#ffe0ae';
 const step=walk?Math.sin(t*9)*2:0;
 ell(x,feet+3*s,12*s,3*s,'#62636e',2);
 p(X+7*s,Y+43*s+step,5*s,13*s,hair);p(X+18*s,Y+43*s-step,5*s,13*s,hair);
 p(X+5*s,Y+55*s+step,8*s,3*s,'#473c4c');p(X+17*s,Y+55*s-step,8*s,3*s,'#473c4c');
 // Clothes with pixel folds.
 p(X+5*s,Y+27*s,22*s,22*s,shirt);p(X+8*s,Y+44*s,18*s,4*s,trim);
 p(X+8*s,Y+30*s,3*s,17*s,trim);p(X+20*s,Y+30*s,2*s,14*s,'#63989f');
 p(X+2*s,Y+30*s,4*s,18*s,shirt);p(X+26*s,Y+30*s,4*s,17*s,shirt);
 p(X+2*s,Y+46*s,4*s,4*s,face);
 const wave=who==='mother' && (Math.floor(t)%4===0);
 p(X+26*s,Y+(wave?18:45)*s,4*s,4*s,face);
 p(X+9*s,Y+22*s,14*s,7*s,shirt);
 // Hair shape and highlights
 p(X+6*s,Y+5*s,20*s,20*s,hair);
 p(X+8*s,Y+2*s,16*s,7*s,hair);
 p(X+5*s,Y+12*s,5*s,22*s,hair);p(X+24*s,Y+12*s,5*s,21*s,hair);
 p(X+8*s,Y+12*s,17*s,13*s,face);
 p(X+8*s,Y+7*s,15*s,6*s,hair);
 p(X+12*s,Y+7*s,5*s,2*s,'#8c6470');
 p(X+12*s,Y+19*s,2*s,2*s,'#453f52');p(X+20*s,Y+19*s,2*s,2*s,'#453f52');
 p(X+16*s,Y+23*s,4*s,1*s,'#b86578');p(X+10*s,Y+21*s,2*s,2*s,'#ef9d99');
 p(X+23*s,Y+21*s,2*s,2*s,'#ef9d99');
 p(X+15*s,Y+29*s,5*s,3*s,trim);
}
function rotor(x,y,s,t){
 // Spinning four sails from transparent raster strokes; 1–3 pixel lath details.
 const a=t*.31;
 for(let arm=0;arm<4;arm++){
   const theta=a+arm*Math.PI/2,ex=x+Math.cos(theta)*74*s,ey=y+Math.sin(theta)*74*s;
   stroke(x,y,ex,ey,'#76535b',4*s);
   const side=theta+Math.PI/2;
   const qx=x+Math.cos(theta)*27*s, qy=y+Math.sin(theta)*27*s;
   const tx=x+Math.cos(theta)*74*s, ty=y+Math.sin(theta)*74*s;
   const dx=Math.cos(side)*14*s,dy=Math.sin(side)*14*s;
   for(let j=0;j<5;j++){
     const f=j/5, xx=qx+(tx-qx)*f,yy=qy+(ty-qy)*f;
     stroke(xx,yy,xx+dx,yy+dy,'#9b7062',2*s);
   }
   for(let j=0;j<5;j++){
     const f=j/5, xx=qx+(tx-qx)*f,yy=qy+(ty-qy)*f;
     stroke(xx+dx*.2,yy+dy*.2,xx+dx*.85,yy+dy*.85,'#f2e1bf',5*s);
   }
   stroke(qx+dx,qy+dy,tx+dx,ty+dy,'#76535b',2*s);
 }
 ell(x,y,7*s,7*s,'#c48b57',2);
 ell(x,y,3*s,3*s,'#f6d38b',1);
}
function ancientTree(x,ground){
 const top=ground-215;
 p(x-16,top+90,38,126,'#705052');
 p(x-6,top+93,11,123,'#a57756');
 stroke(x-10,top+125,x-71,top+31,'#735351',17);
 stroke(x+15,top+127,x+80,top+35,'#735351',19);
 stroke(x-6,top+109,x-35,top-6,'#735351',13);
 stroke(x+10,top+105,x+45,top-13,'#735351',13);
 for(let i=0;i<50;i++)p(x+rr(-15,15),ground-rr(1,109),rr(2,3),rr(5,14),rnd()<.5?'#4e454f':'#bd906a');
 for(const [dx,dy,rx,ry] of [[0,-180,90,50],[-83,-157,65,50],[81,-154,68,55],[-51,-210,69,47],[49,-215,68,47],[0,-234,65,43]]){
   foliage(x+dx,ground+dy,rx,ry,['#245d58','#347d62','#71b35e','#a6d172'],.85);
 }
 for(let i=0;i<22;i++)p(x+rr(-12,12),ground+rr(-9,3),rr(4,15),rr(1,3),'#bbae70');
}
function heart(x,y,s=1,color='#f29ca9'){
 p(x-4*s,y,3*s,2*s,color);p(x+1*s,y,3*s,2*s,color);
 p(x-5*s,y+2*s,10*s,3*s,color);p(x-4*s,y+5*s,8*s,2*s,color);
 p(x-2*s,y+7*s,4*s,2*s,color);
}
function staticScene(stage,W,H){
 const y=Math.round(H*.72);
 if(stage===4){
   p(0,0,W,H,'#e6c3a4');p(0,0,W,y-29,'#f2dcb6');
   for(let i=0;i<900;i++){p(rr(0,W),rr(0,y-30),rr(1,4),rr(1,2),'#f9e7c9');}
   p(0,y-32,W,14,'#866f68');p(0,y-18,W,H-y+18,'#cfac82');
   for(let row=0;row<12;row++){p(0,y-17+row*20,W,2,'#b58c75');
     for(let col=0;col<24;col++)p(col*35+(row%2)*17,y-13+row*20,1,18,'#ac886d');}
   p(90,y-245,588,142,'#805b5b');p(98,y-237,572,127,'#447a69');
   for(let i=0;i<210;i++)p(rr(110,658),rr(y-231,y-116),1,1,rnd()<.5?'#55917d':'#376e60');
   label('20 / 11',384,y-217,29,'#f5e8c6');label('CẢM ƠN CÔ VÌ TẤT CẢ',384,y-173,19,'#f2d6b2');
   p(258,y-77,252,9,'#936d58');p(280,y-69,9,44,'#765759');p(490,y-69,9,44,'#765759');
   for(let i=0;i<6;i++){const xx=70+i*118;
     p(xx,y+16,87,21,'#ab7a65');p(xx+6,y+18,75,8,'#d3a075');
     p(xx+7,y+37,7,35,'#866258');p(xx+72,y+37,7,35,'#866258');}
   for(let i=0;i<13;i++)heart(38+i*56,y-264-(i%2)*8,.6,'#f3bac4');
   return;
 }
 if(stage>=6&&stage<=8){homeRoom(H,y,stage);return;}
 sky(H,y);forestBack(y,stage);
 meadow(H,y);
 if(stage===0){
   path(y,390,352);for(let i=0;i<10;i++){const x=(i%2===0?i*26:768-i*27);oak(x,y+rr(-9,12),.65+i%3*.06,i%4===0);}
   portal(390,y-184);notice(380,y-286,'HÀNH TRÌNH 20/11');
   for(let i=0;i<24;i++)flower(rr(190,600),rr(y+9,H),rr(.6,1.2),i%2?'#f3b8c9':'#efce75');
 }else if(stage===1) {
   // The detailed forest cottage, meadow and windmill evoke classic small-pixel RPG artwork.
   river(578,y-35);path(y,340,377);
   for(let i=0;i<6;i++){const xx=[30,139,256,521,694,740][i];oak(xx,y-rr(15,35),.62+(i%3)*.12,i%5===2);}
   cottage(230,y-25,.93);
   windmill(599,y-23,.72);
   fence(25,y+10,6,32);fence(510,y+14,7,32);
   for(let i=0;i<9;i++)bush(rr(0,768),y+rr(5,62),rr(.45,.9));
 } else if(stage===2){
   river(605,y-15);path(y,327,386);
   for(let i=0;i<11;i++){const x=i%2?680-(i*15):42+(i*21);oak(x,y-rr(5,38),rr(.46,.72),i%4===1);}
   stone(564,y+42,24,15);fence(27,y+42,6,34);
   school(664,y-26,.45);notice(413,y-39,'ĐẾN TRƯỜNG HOA MÂY');
 }else if(stage===3){
   for(let i=0;i<6;i++){const x=i%2?704-i*9:48+i*10;oak(x,y-rr(1,18),.50);}
   school(385,y-26,1.15);
   p(0,y+19,W,16,'#cfae90');fence(18,y+10,7,28);fence(565,y+10,7,28);
   for(let i=0;i<9;i++)bush(rr(15,740),y+rr(15,56),.64);
   notice(387,y+3,'CHÀO MỪNG 20/11');
 }else if(stage===5){
   path(y,385,422);for(let i=0;i<8;i++){const x=i%2?685-i*17:75+i*18;oak(x,y-rr(3,27),.61);}
   cottage(564,y-31,.75);fence(10,y+16,8,32);fence(530,y+23,8,32);
   notice(415,y-21,'VỀ NHÀ THÔI!');
 }else if(stage===9){
   path(y,550,455);ancientTree(547,y+2);
   for(let i=0;i<9;i++){const x=i%2?720-i*24:38+i*24;oak(x,y-rr(10,40),.54+(i%3)*.09);}
   for(let i=0;i<19;i++)bush(rr(0,768),y+rr(2,61),rr(.42,.75));
 }
}
function drawStageAnimation(stage,W,H,t,selectedBloom,bloomCount,reduceMotion){
 const y=Math.round(H*.72),bobs=reduceMotion?0:Math.sin(t*2)*2;
 let hits=[];
 if(stage===0){
   mother(380,y+5+bobs,1.45,t);
   for(let i=0;i<15;i++)p(300+rr(0,170),y-250+rr(0,240),2,2,'#fff0b5');
 }else if(stage===1){
   rotor(599,y-23-116*.72,.72,reduceMotion?0:t);
   mother(394,y+22+bobs,1.36,t,true);
 }else if(stage===2){ mother(388,y+20+bobs,1.37,t,true);
 }else if(stage===3){mother(385,y+62+bobs,1.30,t);
 }else if(stage===4){
   for(let i=0;i<10;i++)sprite(62+i*68,y+80+(i%2)*8,.56,t,i%2?'older':'younger');
   mother(388,y-26+bobs,1.16,t);
 }else if(stage===5){
   const carX=337+Math.sin(t*.6)*15;
   p(carX-66,y+19,145,38,'#d77a82');p(carX-45,y-8,97,29,'#f1a1a1');
   p(carX-39,y-3,36,20,'#b4dee0');p(carX+6,y-3,36,20,'#b4dee0');
   for(let i=0;i<60;i++)p(carX-60+rr(0,135),y+24+rr(0,27),rr(1,3),2,'#eaa4a0');
   for(const xx of [carX-39,carX+52]){ell(xx,y+53,21,21,'#45424e',2);ell(xx,y+53,10,10,'#b7b7b1',2);}
 }else if(stage>=6&&stage<=8){
   mother(331,y+35+bobs,1.3,t);
   sprite(464,y+36,stage===6?1.38:1.25,t,stage===6?'dad':stage===7?'older':'younger');
   heart(411,y-109+Math.sin(t*2)*2,1.2);
 }else if(stage===9){
   mother(300,y+26+bobs,1.26,t);
   const treeX=547,gy=y+2;
   for(let i=0;i<bloomCount;i++){
     const a=i*2.39996,r=16+(i%6)*17;
     const x=pi(treeX+Math.cos(a)*r),fy=pi(gy-188+Math.sin(a)*r*.67);
     const progress=reduceMotion?1:Math.min(1,Math.max(0,(performance.now()-window.__finePixelArrival)/2500));
     if(progress<(i*.022))continue;
     flower(x,fy,2.1,['#f9bacb','#f8dc81','#ecd0e5','#fff3d2'][i%4]);
     hits.push({x,y:fy,index:i});
     if(i===selectedBloom){stroke(x-9,fy-18,x+9,fy-18,'#fff7cc',2);heart(x,fy-29,1,'#fff9ca');}
   }
   for(let i=0;i<8;i++){const px=385+i*39,py=y-75-(i%4)*27+Math.sin(t+i)*3;heart(px,py,.7,i%2?'#f4b2c0':'#ffe6b2');}
 }
 return hits;
}
export function drawFinePixelScene(context,width,height,stage,time,selectedBloom=-1,bloomCount=24,reduceMotion=false){
 const key=stage+':'+width+':'+height;
 let surface=caches.get(key);
 if(!surface){
   surface=document.createElement('canvas');surface.width=width;surface.height=height;
   g=surface.getContext('2d',{alpha:false});g.imageSmoothingEnabled=false;
   seed=47892+stage*7147;
   staticScene(stage,width,height);
   caches.set(key,surface);
 }
 context.drawImage(surface,0,0);
 g=context;seed=194713+stage*47+Math.floor(time*.25);
 return drawStageAnimation(stage,width,height,time,selectedBloom,bloomCount,reduceMotion);
}


/**
 * Outdoor hub world: a single persistent illustrated map linking the school,
 * the car pickup point and the family home. Interior scenes are rendered
 * separately via drawFinePixelScene().
 *
 * All map coordinates use the same 768px world space as the scene renderer.
 */
const overworldCache = new Map();

function mapCar(cx,feet,s=1) {
  const x=cx-34*s, y=feet-24*s;
  ell(cx,feet+4*s,35*s,5*s,'#526c64',2);
  p(x,y+11*s,70*s,18*s,'#714c67');
  p(x+2*s,y+10*s,66*s,16*s,'#df8193');
  p(x+15*s,y,39*s,14*s,'#c76983');
  p(x+19*s,y+3*s,15*s,10*s,'#a9d9df');
  p(x+37*s,y+3*s,13*s,10*s,'#b7e6e5');
  p(x+34*s,y+2*s,3*s,13*s,'#7d6172');
  p(x+3*s,y+15*s,6*s,5*s,'#fff5c9');
  p(x+65*s,y+15*s,5*s,6*s,'#ffd093');
  for(const dx of [14,57]) {
    ell(x+dx*s,y+29*s,9*s,10*s,'#433e4c',2);
    ell(x+dx*s,y+29*s,4*s,4*s,'#b7b7ad',2);
  }
  for(let i=0;i<15;i++)p(x+(i*13%68)*s,y+(18+i%3)*s,2*s,1*s,i%2?'#f6b8af':'#ae617d');
}
function mapWaystone(cx,feet,kind) {
  p(cx-12,feet-13,24,16,'#6b715f');
  p(cx-9,feet-15,18,16,kind==='school'?'#e4c2aa':kind==='home'?'#c9afbe':'#9eb8a7');
  p(cx-4,feet-9,9,4,'#fff2d7');
  p(cx-2,feet-9,5,2,kind==='home'?'#ba718d':'#7c6775');
  p(cx-9,feet+1,18,3,'#89877a');
}
function mapTrailDot(cx,cy,i) {
  const color=i%3===0?'#fff3cf':i%2?'#d8b896':'#b59577';
  p(cx,cy,2,2,color);
}

export function drawOverworldMap(context,width,height,t,avatar,carPosition=null,reduceMotion=false) {
  const key=width+'x'+height;
  let surface=overworldCache.get(key);
  if(!surface) {
    surface=document.createElement('canvas');
    surface.width=width;
    surface.height=height;
    g=surface.getContext('2d',{alpha:false});
    g.imageSmoothingEnabled=false;
    seed=157732;
    staticScene(1,width,height);
    // Hand-sprinkled flower beds and stone route connect the three points.
    const base=Math.round(height*.72);
    for(let seg=0;seg<2;seg++){
      const a=seg===0?[236,base+28]:[433,base+55];
      const b=seg===0?[433,base+55]:[598,base+26];
      for(let i=0;i<=70;i++){
        const z=i/70;
        const tx=a[0]+(b[0]-a[0])*z;
        const ty=a[1]+(b[1]-a[1])*z+Math.sin(z*Math.PI)*13*(seg?1:-1);
        for(let j=0;j<4;j++)mapTrailDot(tx+rr(-5,5),ty+rr(-3,3),i+j);
      }
    }
    for(let i=0;i<34;i++) {
      const x=rr(0,width),yy=base+rr(10,Math.min(112,height-base-5));
      if(Math.abs(x-432)<59&&Math.abs(yy-base-55)<30)continue;
      flower(x,yy,rr(.45,.75),i%3===0?'#f3adbd':i%3===1?'#ffebc9':'#e9d4f9');
    }
    mapWaystone(228,base+28,'school');
    mapWaystone(605,base+31,'home');
    overworldCache.set(key,surface);
    // Avoid growing beyond a handful of surfaces on repeated viewport resizes.
    if(overworldCache.size>4)overworldCache.delete(overworldCache.keys().next().value);
  }
  context.drawImage(surface,0,0);
  g=context;
  seed=182013+Math.floor(t*2);
  const base=Math.round(height*.72);
  rotor(599,base-23-116*.72,.72,reduceMotion?0:t);
  // The parked car lives on the map; while driving it follows the bridge.
  if(carPosition) mapCar(carPosition.x,carPosition.y,1.05);
  else mapCar(433,base+56,1.05);
  if(avatar && avatar.visible!==false) {
    sprite(avatar.x,avatar.y,1.10,reduceMotion?0:t,'mother',Boolean(avatar.walking));
    if(avatar.walking&&!reduceMotion&&Math.floor(t*4)%2===0)
      heart(avatar.x+25,avatar.y-60,.48,'#f2b9c9');
  }
}


// Story edition: one exterior world, illustrated rooms and a third-floor rooftop.
const storyCache = new Map();
const storyMapCache = new Map();
const pixelPalette = ['#f8dd86','#eaa0a7','#f7f0ce','#a9d8aa','#b5b8e4'];
const pick = arr => arr[Math.floor(rnd()*arr.length)];
function storyGround(H){return Math.round(H*.72);}
function floralBorder(x,y,w,n=11) {
  for(let i=0;i<n;i++){
    const fx=x+i*w/(n-1),fy=y+Math.sin(i*2.6)*4;
    bush(fx,fy,.42+(i%3)*.05);
    if(i%2===0)flower(fx-8,fy-6,.7,pick(pixelPalette));
  }
}
function woodenSign(x,y,w,text) {
  p(x-w/2-4,y-15,w+8,33,'#704e54');
  p(x-w/2,y-11,w,25,'#f7ddab');
  p(x-w/2+5,y-7,w-10,17,'#ffeac4');
  label(text,x,y,13,'#71465a');
  p(x-w/2+6,y-10,3,4,'#c99075');
  p(x+w/2-9,y-10,3,4,'#c99075');
}
function gardenArch(x,y,sc=1){
  p(x-55*sc,y-111*sc,12*sc,116*sc,'#875d53');
  p(x+43*sc,y-111*sc,12*sc,116*sc,'#875d53');
  p(x-59*sc,y-111*sc,118*sc,13*sc,'#9f745d');
  p(x-53*sc,y-119*sc,105*sc,7*sc,'#e4b17a');
  for(let i=0;i<9;i++) {
    const fx=x+(-49+i*12)*sc;
    foliage(fx,y-(113+(i%3)*4)*sc,10*sc,8*sc,
      ['#347c5c','#599d6c','#8cc06b','#b3d27a'],.4);
  }
  flower(x-56*sc,y-87*sc,1*sc,'#f1a7b4');
  flower(x+51*sc,y-73*sc,1*sc,'#eebad2');
}
function stairsIllustration(W,H){
 const base=storyGround(H);
 p(0,0,W,H,'#ead3ad');p(0,0,W,base+13,'#f2d9b2');
 for(let i=0;i<1200;i++)p(rr(0,W),rr(0,base),rr(1,2),rr(1,2),'#f9e5c7');
 p(0,base-5,W,H-base+5,'#a87769');
 for(let i=0;i<24;i++){p(i*37,base,2,H-base,'#885d5e');p(0,base+i*19,W,2,'#ba8d72');}
 // Perspective wall with open banister and the stair landing.
 p(0,base-195,238,18,'#b67a6a');
 p(22,base-193,14,193,'#8b6660');
 p(204,base-193,14,193,'#8b6660');
 p(38,base-185,164,154,'#c59f85');
 p(46,base-178,148,140,'#8ca5a1');
 p(54,base-170,132,124,'#b6d4c9');
 p(54,base-102,132,5,'#f9e2b1');
 p(120,base-170,5,124,'#f9e2b1');
 cloud(124,base-128,.8);
 for(let i=0;i<10;i++){
   const yy=base+38-i*19;
   const xx=270+i*24;
   const w=280-i*13;
   p(xx,yy,w,16,'#6c4d55');
   p(xx+3,yy,w-6,11,'#bf8f76');
   p(xx+6,yy+2,w-12,3,'#e4bb8f');
   p(xx+w-9,yy-25,8,42,'#8f6b61');
 }
 stroke(271,base+37,527,base-148,'#8c6158',9);
 stroke(277,base+30,532,base-151,'#e3af7d',4);
 for(let i=0;i<11;i++){
   const xx=283+i*22,yy=base+12-i*16;
   stroke(xx,yy,xx,yy-28,'#75535a',3);
 }
 p(532,base-200,178,187,'#e7bb8d');p(544,base-192,154,164,'#9d6d65');
 p(559,base-178,123,143,'#d5a579');
 p(667,base-115,6,5,'#ffe5a1');
 p(531,base-202,182,9,'#6e5256');
 floralBorder(34,base+12,177,7);
 floralBorder(593,base+9,134,5);
}
function schoolCorridor(W,H){
 const base=storyGround(H);
 p(0,0,W,H,'#f9ddba');
 p(0,0,W,base-22,'#f3d7b0');
 for(let i=0;i<2200;i++)p(rr(0,W),rr(0,base-25),rr(1,2),rr(1,2),rnd()<.5?'#f9e5c4':'#e9bd9b');
 p(0,base-28,W,17,'#ba8172');
 p(0,base-11,W,H-base+11,'#cfa783');
 // Hallway perspective with highly visible classroom door.
 for(let i=0;i<8;i++) {
   const x=i*97+12;
   p(x,base-245,6,236,'#e4b38d');
   p(x+7,base-246,89,7,'#fff0d2');
   p(x+7,base-82,89,4,'#d39880');
   if(i<7) {
     p(x+15,base-219,71,117,'#9b7970');
     p(x+20,base-212,61,103,'#aed1cb');
     p(x+25,base-206,51,93,'#cde2d4');
     p(x+48,base-206,4,93,'#ebcead');
     p(x+20,base-163,61,4,'#ebcead');
   }
 }
 // Classroom is the scene's main focal point, with board inside the open doorway.
 p(310,base-250,150,241,'#684e58');
 p(321,base-240,128,231,'#a87b65');
 p(330,base-231,113,222,'#dfb49a');
 p(344,base-214,85,119,'#4b8071');
 p(346,base-208,81,111,'#477766');
 label('LỚP HỌC',387,base-158,18,'#ffefca');
 label('20/11',387,base-132,13,'#ffe6bc');
 p(337,base-98,101,14,'#ba9277');
 p(336,base-61,106,11,'#a9796a');
 p(446,base-214,7,230,'#805b5b');
 p(452,base-214,29,232,'#cc977e');
 p(457,base-208,17,220,'#f0c6a1');
 for(let i=0;i<10;i++) {
   const x=i*96+rr(0,15),y=base+rr(12,90);
   p(x,y,rr(28,60),2,'#e0c0a0');
 }
 p(56,base-276,654,19,'#c78379');
 p(63,base-274,643,14,'#f7d2a6');
 label('CHÀO MỪNG NGÀY NHÀ GIÁO VIỆT NAM',385,base-267,18,'#9a5c68');
 for(let i=0;i<14;i++)flower(24+i*55,base-18,1.1,i%2?'#ed91aa':'#f3df9c');
}
function schoolExterior(W,H,exitMode=false) {
 const base=storyGround(H);
 sky(H,base);
 forestBack(base-10);
 meadow(H,base);
 for(let i=0;i<5;i++) oak(i%2?685-i*15:55+i*21,base-14,.53+(i%3)*.1,i===3);
 school(381,base-15,1.3);
 path(base+1,383,383);
 p(58,base+9,W-116,6,'#c8ac8c');
 fence(12,base+12,8,29);fence(537,base+12,8,29);
 gardenArch(386,base+5,1);
 for(let i=0;i<15;i++) {
   const xx=55+i*47;
   flower(xx,base+rr(10,55),.8,i%3===0?'#f5a1bc':'#fff1af');
 }
 woodenSign(380,base-257,210,'TRƯỜNG HOA MÂY');
 if(exitMode) {
   woodenSign(554,base+35,160,'TAN LỚP RỒI!');
   p(505,base+27,18,11,'#e5b894');p(524,base+27,25,5,'#ce8f81');
 }
}
function boardingScene(W,H) {
 const base=storyGround(H);
 sky(H,base-20); forestBack(base-15); meadow(H,base);
 // Cobblestone roadside near the car, school visible in distance.
 school(123,base-62,.47);
 p(0,base+22,W,H-base-22,'#a48983');
 p(0,base+24,W,9,'#7e7575');
 for(let i=0;i<18;i++)p(i*48,base+64,25,4,'#f5dfaf');
 for(let i=0;i<6;i++) oak(i*137+12,base-25,.38+(i%2)*.10,i===1);
 fence(24,base+2,7,32);fence(560,base+3,6,31);
 woodenSign(403,base-161,177,'XE ĐÓN MẸ');
 bush(655,base+12,.78);
}
function drivingScene(W,H) {
 const base=storyGround(H);
 sky(H,base-27);
 forestBack(base-36);
 meadow(H,base-26);
 // Long diagonal road with distant trees, mountain ridges and moving route.
 p(0,base+2,W,H-base,'#756c7d');
 p(0,base+7,W,H-base-7,'#9c8388');
 p(0,base+10,W,16,'#b2a1a0');
 p(0,H-22,W,9,'#b2a1a0');
 for(let i=0;i<10;i++) {
  const xx=i*90+11;
  stone(xx,base-21,rr(9,15),rr(5,9));
  flower(xx+11,base-33,.85,pick(pixelPalette));
 }
 for(let i=0;i<8;i++) oak(i*122-12,base-48,.41+(i%3)*.04,i%4===1);
 cottage(675,base-52,.43);
 woodenSign(372,base-120,215,'CON ĐƯỜNG VỀ NHÀ');
}
function homeExterior(W,H) {
 const base=storyGround(H);
 sky(H,base);
 forestBack(base-9);
 meadow(H,base);
 for(let i=0;i<7;i++) oak(35+i*117,base-20,.42+(i%3)*.1,i===2);
 path(base-11,381,377);
 cottage(387,base-7,1.64);
 fence(18,base+4,8,35); fence(511,base+5,7,35);
 floralBorder(56,base+29,665,17);
 woodenSign(384,base-294,193,'NHÀ CỦA MẸ');
 gardenArch(388,base+20,1.05);
}
function roomOverlay(W,H,name){
 const base=storyGround(H);
 if(name==='floor1'){
   woodenSign(W*.50,base-323,220,'TẦNG 1 · PHÒNG KHÁCH');
   p(274,base-130,110,42,'#986f64');
   p(283,base-126,91,35,'#dfc097');
   p(285,base-118,27,22,'#ecd0a9');
   p(317,base-118,27,22,'#e7bca7');
   p(349,base-118,21,22,'#d4b0b6');
 }else if(name==='floor2older'){
   woodenSign(W*.50,base-323,252,'TẦNG 2 · GẶP ANH TRAI');
   for(let i=0;i<9;i++) {
     p(470+i*14,base-153,9,20+(i%3)*7,['#d09e77','#7fa5ad','#b7b19b'][i%3]);
   }
 }else if(name==='floor2younger'){
   woodenSign(W*.50,base-323,252,'TẦNG 2 · GẶP EM TRAI');
   for(let i=0;i<7;i++) {
     const tx=474+i*21;
     p(tx,base-132,15,14,['#9dafa4','#dd9e93','#d8c38e'][i%3]);
     p(tx+3,base-136,9,4,'#fff1c1');
   }
 }
}
function rooftop(W,H){
 const base=storyGround(H);
 sky(H,base);
 // Open sky and unmistakable top-floor roof terrace setting.
 p(0,base-21,W,24,'#b78179');
 p(0,base-22,W,8,'#e4ad89');
 p(0,base+3,W,H-base,'#c7a084');
 for(let i=0;i<24;i++){p(i*37,base+11,33,2,'#9e7a6d');p(i*37,base+32,2,H-base-31,'#a8796d');}
 for(let i=0;i<23;i++) {
   const xx=i*36-6;
   p(xx,base-65,8,44,'#987c77');
   p(xx-4,base-70,16,7,'#d2a890');
 }
 p(0,base-49,W,5,'#dcad91');
 p(0,base-66,W,5,'#d2a890');
 gardenArch(384,base-12,1.60);
 ancientTree(448,base+12);
 for(let i=0;i<16;i++){
   const x=i*54+5;
   bush(x,base+10,.60+(i%2)*.12);
   if(i%2===0)flower(x+17,base+12,.9,'#f4bdc9');
 }
 woodenSign(379,base-335,242,'TẦNG 3 · CÂY ĐIỀU ƯỚC');
 for(let i=0;i<18;i++)heart(82+i*36,base-89-(i%5)*13,.55,
   i%2?'#ffe4bf':'#f4b2cb');
}
function storySceneStatic(id,W,H){
 if(id==='school-front')schoolExterior(W,H,false);
 else if(id==='school-hall')schoolCorridor(W,H);
 else if(id==='school-exit')schoolExterior(W,H,true);
 else if(id==='car-boarding')boardingScene(W,H);
 else if(id==='car-driving')drivingScene(W,H);
 else if(id==='home-front')homeExterior(W,H);
 else if(id==='stairs')stairsIllustration(W,H);
 else if(id==='wish-rooftop')rooftop(W,H);
}
export function drawStoryLocation(context,W,H,id,time,selectedFlower=-1,wishesCount=24,reduceMotion=false){
 if(id==='classroom')return drawFinePixelScene(context,W,H,4,time,selectedFlower,wishesCount,reduceMotion);
 if(id==='floor1'||id==='floor2older'||id==='floor2younger'){
   const source=id==='floor1'?6:id==='floor2older'?7:8;
   const hits=drawFinePixelScene(context,W,H,source,time,selectedFlower,wishesCount,reduceMotion);
   g=context;seed=1137+source;
   roomOverlay(W,H,id);
   return hits;
 }
 const key=id+':'+W+':'+H;
 let surface=storyCache.get(key);
 if(!surface){
   surface=document.createElement('canvas');
   surface.width=W;surface.height=H;
   g=surface.getContext('2d',{alpha:false});
   g.imageSmoothingEnabled=false;
   seed=493817+id.length*121;
   storySceneStatic(id,W,H);
   storyCache.set(key,surface);
   if(storyCache.size>16)storyCache.delete(storyCache.keys().next().value);
 }
 context.drawImage(surface,0,0);
 g=context;seed=13738+Math.floor(time*3);
 const base=storyGround(H),bob=reduceMotion?0:Math.sin(time*2.5)*2;
 let hits=[];
 if(id==='school-front'||id==='school-exit'){
   sprite(id==='school-exit'?500:384,base+54+bob,1.17,time,'mother',false);
   for(let i=0;i<9;i++)flower(35+i*82,base+10+(i%3)*12,.85,i%2?'#fff0c5':'#f3aaba');
 } else if(id==='school-hall') {
   sprite(372,base+32+bob,1.29,time,'mother',false);
 } else if(id==='car-boarding'){
   mapCar(471,base+26,2.05);
   sprite(322,base+43+bob,1.26,time,'mother',false);
 } else if(id==='car-driving'){
   // Car moves independently across the illustrated road.
   const x=200+(reduceMotion?190:(time*63)%325);
   mapCar(x,base+63,2.08);
   for(let i=0;i<7;i++)p((x-102-i*17+W)%W,base+51+i%3*5,rr(2,6),2,'#e7d9c7');
 } else if(id==='home-front'){
   mapCar(610,base+59,1.04);
   sprite(401,base+65+bob,1.26,time,'mother',false);
 } else if(id==='stairs'){
   sprite(542,base-47+bob,1.19,time,'mother',true);
 } else if(id==='wish-rooftop'){
   sprite(239,base+46+bob,1.19,time,'mother',false);
   const arrival=window.__finePixelArrival||performance.now();
   const progress=reduceMotion?1:Math.min(1,(performance.now()-arrival)/2600);
   for(let i=0;i<wishesCount;i++){
     const a=i*2.39996,r=17+(i%6)*17;
     const x=pi(448+Math.cos(a)*r);
     const y=pi(base-190+Math.sin(a)*r*.7);
     if(progress<i*.025)continue;
     flower(x,y,2.05,pixelPalette[i%pixelPalette.length]);
     hits.push({x,y,index:i});
     if(selectedFlower===i)heart(x,y-21,.95,'#fff3cc');
   }
   for(let i=0;i<11;i++){
     const x=(64+i*73)%W,y=base-105-(i%5)*23+Math.sin(time+i)*4;
     heart(x,y,.6,i%2?'#e9b0c5':'#fff2d0');
   }
 }
 return hits;
}
export function drawRpgOverworld(context,W,H,time,avatar,carPosition=null,reduceMotion=false){
 const base=storyGround(H),key=W+':'+H;
 let surface=storyMapCache.get(key);
 if(!surface){
   surface=document.createElement('canvas');
   surface.width=W;surface.height=H;
   g=surface.getContext('2d',{alpha:false});
   g.imageSmoothingEnabled=false;
   seed=897112;
   sky(H,base-25);
   forestBack(base-39);
   meadow(H,base-15);
   for(let i=0;i<9;i++) {
     const x=i*99-9,yy=base-rr(6,40);
     oak(x,yy,.46+(i%3)*.11,i===5);
   }
   river(488,base-34);
   path(base-19,330,388);
   school(364,base-56,.73);
   cottage(145,base+8,.71);
   windmill(685,base-48,.61);
   ancientTree(660,base+77);
   // Stone paths and garden beds.
   for(let i=0;i<125;i++){
     const t=i/124;
     const x=360+145*t,yy=base-13+41*t+Math.sin(t*8)*8;
     stone(x+rr(-6,6),yy+rr(-4,4),rr(2,6),rr(1,3));
   }
   for(let i=0;i<90;i++){
     const t=i/89,x=496-325*t,yy=base+23+12*t+Math.sin(t*6)*17;
     stone(x+rr(-6,6),yy+rr(-4,4),rr(2,6),rr(1,3));
   }
   fence(9,base+7,8,22);
   fence(587,base+9,7,25);
   floralBorder(24,base+25,697,21);
   for(let i=0;i<9;i++)bush(rr(5,760),base+rr(-2,61),rr(.38,.8));
   storyMapCache.set(key,surface);
   if(storyMapCache.size>4)storyMapCache.delete(storyMapCache.keys().next().value);
 }
 context.drawImage(surface,0,0);
 g=context;seed=577919+Math.floor(time*2);
 rotor(685,base-48-116*.61,.61,reduceMotion?0:time);
 if(carPosition)mapCar(carPosition.x,carPosition.y,.94);
 else mapCar(528,base+31,.94);
 if(avatar&&avatar.visible!==false) {
   sprite(avatar.x,avatar.y,1.07,time,'mother',Boolean(avatar.walking));
 }
}
