const names=['school-thanhhoa.png','home-townhouse.png','story-atlas.png','details-atlas.png','family.png','mother-walk.png','car-action.png','town-road.png'];
const images=[],bounds=new Map();
export async function loadIllustrations(){
 await Promise.all(names.map((name,i)=>new Promise((resolve,reject)=>{
  const im=new Image();images[i]=im;im.onload=resolve;im.onerror=()=>reject(new Error('Không tải được '+name));
  im.src=new URL('../assets/illustrations/'+name,import.meta.url).href;
 })));
 // Read alpha bounds to keep differently padded walk frames anchored to the feet.
 for(const [img,cols,rows] of [[4,4,1],[5,4,2],[6,2,1]]){
  const im=images[img],c=document.createElement('canvas');c.width=im.width;c.height=im.height;
  const g=c.getContext('2d',{willReadFrequently:true});g.drawImage(im,0,0);
  const {data}=g.getImageData(0,0,c.width,c.height),cw=Math.floor(c.width/cols),ch=Math.floor(c.height/rows);
  for(let row=0;row<rows;row++)for(let col=0;col<cols;col++){
   let l=cw,r=0,t=ch,b=0;
   for(let y=0;y<ch;y++)for(let x=0;x<cw;x++)if(data[((row*ch+y)*c.width+col*cw+x)*4+3]>40){l=Math.min(l,x);r=Math.max(r,x);t=Math.min(t,y);b=Math.max(b,y);}
   bounds.set(`${img}:${col}:${row}`,[col*cw+l,row*ch+t,r-l+1,b-t+1]);
  }
 }
}
function character(ctx,a,clock){
 if(!a.visible)return;
 const walking=a.walking,img=walking?5:4,col=walking?Math.floor(clock/130)%4:3,row=walking&&a.direction==='north'?1:0;
 const [sx,sy,sw,sh]=bounds.get(`${img}:${col}:${row}`),w=a.size*sw/sh;
 ctx.save();ctx.translate(a.x,a.y);if(a.direction==='west')ctx.scale(-1,1);
 ctx.fillStyle='#20352d45';ctx.beginPath();ctx.ellipse(0,0,w*.25,4,0,0,Math.PI*2);ctx.fill();
 ctx.drawImage(images[img],sx,sy,sw,sh,-w/2,-a.size,w,a.size);ctx.restore();
}
function car(ctx,x,y,width,open,travel){
 const [sx,sy,sw,sh]=bounds.get(`6:${open?1:0}:0`),h=width*sh/sw;
 ctx.drawImage(images[6],sx,sy,sw,sh,x-width/2,y-h,width,h);
 if(travel){ctx.strokeStyle='#b5c3d6';ctx.lineWidth=2;for(const wheel of [-.31,.32]){
  const cx=x+width*wheel,cy=y-h*.14,r=h*.12;
  for(let k=0;k<3;k++){const a=travel/90+k*Math.PI/3;ctx.beginPath();ctx.moveTo(cx-Math.cos(a)*r,cy-Math.sin(a)*r);ctx.lineTo(cx+Math.cos(a)*r,cy+Math.sin(a)*r);ctx.stroke();}
 }}
}
const cells={classroom:[2,1,0,2,3],floor1:[2,1,1,2,3],floor2older:[2,0,2,2,3],floor2younger:[2,0,2,2,3],'wish-rooftop':[2,1,2,2,3],'school-hall':[3,0,0,2,2],stairs:[3,1,1,2,2]};
function backdrop(ctx,W,H,id){
 const source=id==='home-front'?images[1]:['school-front','school-exit','car-boarding'].includes(id)?images[0]:id==='car-driving'?images[7]:null;
 if(source){ctx.drawImage(source,0,0,W,H);return;}
 const [i,col,row,cols,rows]=cells[id],im=images[i],sw=im.width/cols,sh=im.height/rows;
 ctx.drawImage(im,col*sw,row*sh,sw,sh,0,0,W,H);
}
export function renderScene(ctx,W,H,id,actor,state){
 backdrop(ctx,W,H,id);
 const {clock,progress,moving,selectedBloom}=state;
 if(id==='car-driving'){
  const x=W*(.08+.84*progress);
  car(ctx,x,H*.93,450,false,clock);
 }else if(id==='car-boarding'){
  const open=moving&&progress>.25&&progress<.9;
  if(!moving||progress<.77)character(ctx,actor,clock);
  car(ctx,W*.62,H*.92,490,open,0);
 }else{
  if(id==='home-front')car(ctx,W*.8,H*.94,370,false,0);
  character(ctx,actor,clock);
 }
 const hits=[];
 if(id==='wish-rooftop')for(let i=0;i<24;i++){
  const a=i*2.39996,r=45+(i%6)*35,x=W*.52+Math.cos(a)*r,y=H*.4+Math.sin(a)*r*.66;
  hits.push({x,y,index:i});ctx.fillStyle=selectedBloom===i?'#fff9d5':'#ffacd3';
  for(const [dx,dy] of [[-7,0],[7,0],[0,-7],[0,7]]){ctx.beginPath();ctx.arc(x+dx,y+dy,6,0,Math.PI*2);ctx.fill();}
  ctx.fillStyle='#ffe7a3';ctx.fillRect(x-3,y-3,6,6);
 }
 return hits;
}
