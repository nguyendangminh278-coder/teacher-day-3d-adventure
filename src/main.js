(() => {
  'use strict';

  const canvas = document.getElementById('game');
  const ctx = canvas.getContext('2d', { alpha: false, desynchronized: true });
  const ui = {
    action: document.getElementById('actionBtn'),
    actionLabel: document.getElementById('actionLabel'),
    stageNumber: document.getElementById('stageNumber'),
    objectiveTitle: document.getElementById('objectiveTitle'),
    objectiveText: document.getElementById('objectiveText'),
    dialogue: document.getElementById('dialogue'),
    dialogueName: document.getElementById('dialogueName'),
    dialogueText: document.getElementById('dialogueText'),
    classPanel: document.getElementById('classroomPanel'),
    classWishes: document.getElementById('classWishes'),
    dismissClass: document.getElementById('dismissClass'),
    finalPanel: document.getElementById('finalPanel'),
    replay: document.getElementById('replayBtn'),
    fade: document.getElementById('fade'),
    loading: document.getElementById('loading')
  };

  const CLASS_WISHES = [
    'Chúc cô luôn mạnh khỏe 💗','Chúc mẹ 20/11 thật vui vẻ 💗','Cảm ơn cô vì tất cả!',
    'Chúc cô luôn hạnh phúc','Biết ơn cô rất nhiều','Chúc cô luôn thành công',
    'Chúc cô luôn bình an','Cảm ơn cô đã luôn kiên nhẫn','Cảm ơn cô vì đã truyền cảm hứng',
    'Chúc cô giữ mãi nụ cười','Chúc cô luôn trẻ trung','Cảm ơn cô đã luôn tin tưởng chúng em',
    'Chúc cô thật nhiều sức khỏe','Chúc cô luôn an yên','Chúc cô mãi là người thầy tuyệt vời',
    'Chúc cô gặp thật nhiều may mắn','Cảm ơn cô vì những bài học quý giá','Chúc cô luôn vững tin',
    'Chúc cô nhiều niềm vui mỗi ngày','Chúc cô luôn được yêu thương','Cảm ơn cô đã dìu dắt chúng em',
    'Chúc cô luôn tỏa sáng','Chúc cô thật nhiều điều tốt đẹp','Chúc cô luôn đủ đầy yêu thương',
    'Chúc cô mãi hạnh phúc bên gia đình'
  ];

  const STAGES = [
    ['Gặp Mầm Nhỏ','Chạm để bắt đầu hành trình đặc biệt.','Bắt đầu'],
    ['Khu vườn trên mây','Theo Mầm Nhỏ qua khu vườn và con đường hoa.','Đi tiếp'],
    ['Đến trường của mẹ','Đi theo con đường hoa đến cổng trường.','Đến trường'],
    ['Bước qua cánh cổng','Đi qua hành lang và tìm lớp học của mẹ.','Vào lớp'],
    ['Những lời chúc','Lắng nghe những lời chúc học trò dành tặng cô.','Mở lời chúc'],
    ['Về nhà thôi','Tan học rồi. Cùng Mầm Nhỏ trở về tổ ấm.','Lên xe'],
    ['Tổ ấm của mẹ','Gặp gia đình và đi lên tầng cao nhất.','Lên tầng 3'],
    ['Cây điều ước','Chạm để tất cả lời chúc nở thành hoa trên cây.','Nở hoa']
  ];

  CLASS_WISHES.forEach((w) => {
    const el = document.createElement('div');
    el.className = 'wish-card';
    el.textContent = w;
    ui.classWishes.appendChild(el);
  });

  let W = 0, H = 0, DPR = 1;
  let stage = 0;
  let transition = 0;
  let transitionDir = 0;
  let nextStage = null;
  let mouseX = 0;
  let last = performance.now();
  let time = 0;
  let bloom = 0;

  const rnd = (n) => {
    const x = Math.sin(n * 12.9898 + 78.233) * 43758.5453;
    return x - Math.floor(x);
  };

  function resize() {
    DPR = Math.min(window.devicePixelRatio || 1, 1.5);
    W = Math.max(1, window.innerWidth);
    H = Math.max(1, window.innerHeight);
    canvas.width = Math.round(W * DPR);
    canvas.height = Math.round(H * DPR);
    canvas.style.width = W + 'px';
    canvas.style.height = H + 'px';
    ctx.setTransform(DPR, 0, 0, DPR, 0, 0);
  }

  function roundedRect(x, y, w, h, r) {
    const rr = Math.min(r, w / 2, h / 2);
    ctx.beginPath();
    ctx.moveTo(x + rr, y);
    ctx.arcTo(x + w, y, x + w, y + h, rr);
    ctx.arcTo(x + w, y + h, x, y + h, rr);
    ctx.arcTo(x, y + h, x, y, rr);
    ctx.arcTo(x, y, x + w, y, rr);
    ctx.closePath();
  }

  function gradient(top, bottom) {
    const g = ctx.createLinearGradient(0, 0, 0, H);
    g.addColorStop(0, top); g.addColorStop(1, bottom);
    ctx.fillStyle = g; ctx.fillRect(0, 0, W, H);
  }

  function cloud(x, y, s = 1, a = 0.8) {
    ctx.save(); ctx.globalAlpha = a; ctx.fillStyle = '#fffdf9';
    [[0,0,28],[28,6,22],[-27,7,21],[8,-15,23]].forEach(([dx,dy,r]) => {
      ctx.beginPath(); ctx.arc(x + dx*s, y + dy*s, r*s, 0, Math.PI*2); ctx.fill();
    });
    ctx.restore();
  }

  function flower(x, y, s = 1, color = '#ff8eb2') {
    ctx.save(); ctx.translate(x, y); ctx.scale(s, s);
    ctx.strokeStyle = '#5f9b56'; ctx.lineWidth = 3; ctx.beginPath(); ctx.moveTo(0, 10); ctx.lineTo(0, 34); ctx.stroke();
    for (let i=0;i<5;i++) {
      const a = i*Math.PI*2/5; ctx.fillStyle=color; ctx.beginPath(); ctx.ellipse(Math.cos(a)*9, Math.sin(a)*9, 7, 10, a, 0, Math.PI*2); ctx.fill();
    }
    ctx.fillStyle='#ffd66d'; ctx.beginPath(); ctx.arc(0,0,5,0,Math.PI*2); ctx.fill(); ctx.restore();
  }

  function mascot(x, y, s = 1, bob = 0) {
    ctx.save(); ctx.translate(x, y + bob); ctx.scale(s,s);
    ctx.fillStyle='rgba(70,43,45,.16)'; ctx.beginPath(); ctx.ellipse(0,42,33,9,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#825a3e'; roundedRect(-24,-2,48,36,8); ctx.fill();
    ctx.fillStyle='#fff6ed'; ctx.beginPath(); ctx.ellipse(0,-2,31,38,0,0,Math.PI*2); ctx.fill();
    ctx.beginPath(); ctx.ellipse(0,-43,28,25,0,0,Math.PI*2); ctx.fill();
    ctx.fillStyle='#2d2424'; ctx.beginPath(); ctx.arc(-9,-47,3,0,Math.PI*2); ctx.arc(9,-47,3,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#5b343a'; ctx.lineWidth=2; ctx.beginPath(); ctx.arc(0,-39,7,0,Math.PI); ctx.stroke();
    ctx.fillStyle='#ff9eab'; ctx.beginPath(); ctx.ellipse(-17,-38,6,3,0,0,Math.PI*2); ctx.ellipse(17,-38,6,3,0,0,Math.PI*2); ctx.fill();
    ctx.strokeStyle='#5f9c55'; ctx.lineWidth=4; ctx.beginPath(); ctx.moveTo(0,-68); ctx.lineTo(1,-82); ctx.stroke();
    ctx.fillStyle='#72b764'; ctx.beginPath(); ctx.ellipse(-7,-83,10,5,-.4,0,Math.PI*2); ctx.ellipse(9,-83,10,5,.4,0,Math.PI*2); ctx.fill();
    ctx.restore();
  }

  function sign(text, x, y, w, h, fs = 18, color = '#b85679') {
    ctx.save(); ctx.fillStyle='rgba(255,250,250,.90)'; ctx.strokeStyle='rgba(255,255,255,.95)'; ctx.lineWidth=2;
    roundedRect(x-w/2,y-h/2,w,h,18); ctx.fill(); ctx.stroke();
    ctx.fillStyle=color; ctx.font=`800 ${fs}px system-ui`; ctx.textAlign='center'; ctx.textBaseline='middle';
    ctx.fillText(text, x, y); ctx.restore();
  }

  function perspectiveRoad(horizonY, leftBottom, rightBottom, topHalf, color='#f2d8c4') {
    const cx=W/2 + mouseX*18;
    ctx.fillStyle=color; ctx.beginPath();
    ctx.moveTo(cx-topHalf,horizonY); ctx.lineTo(cx+topHalf,horizonY); ctx.lineTo(cx+rightBottom,H); ctx.lineTo(cx-leftBottom,H); ctx.closePath(); ctx.fill();
  }

  function drawIntro(t) {
    gradient('#a9d4ff','#ffd3dc');
    for(let i=0;i<10;i++) cloud((rnd(i)*1.2-.1)*W, 80+rnd(i+9)*H*.45, .7+rnd(i+20)*1.1, .45+.4*rnd(i+30));
    const cx=W/2 + mouseX*14, cy=H*.42;
    ctx.save(); ctx.translate(cx,cy); ctx.rotate(t*.25);
    ctx.strokeStyle='#8b6cff'; ctx.lineWidth=18; ctx.shadowBlur=28; ctx.shadowColor='#8b6cff'; ctx.beginPath(); ctx.arc(0,0,Math.min(W,H)*.16,0,Math.PI*2); ctx.stroke();
    ctx.strokeStyle='#ffd5a6'; ctx.lineWidth=4; ctx.beginPath(); ctx.arc(0,0,Math.min(W,H)*.20,0,Math.PI*2); ctx.stroke(); ctx.restore();
    mascot(cx, cy+Math.min(W,H)*.19, .9, Math.sin(t*2.3)*5);
    sign('Chúc mừng mẹ ngày Nhà giáo Việt Nam 20/11', W/2, H*.15, Math.min(650,W*.8), 58, Math.min(22,W*.035));
  }

  function drawGarden(t) {
    gradient('#b6ddff','#eaf4d7');
    const horizon=H*.37;
    cloud(W*.17,H*.2,1.1,.65); cloud(W*.8,H*.23,.9,.6);
    perspectiveRoad(horizon, W*.42,W*.42,28,'#f5ead4');
    for(let i=0;i<14;i++) {
      const p=i/13, yy=horizon+(H-horizon)*Math.pow(p,.72), spread=(W*.05)+(W*.42)*p;
      const s=.25+1.2*p; flower(W/2-spread,yy,s,i%3===0?'#ffd77d':'#ff8eb2'); flower(W/2+spread,yy,s,i%4===0?'#b98cff':'#ff8eb2');
    }
    mascot(W/2+mouseX*10,H*.69,.9,Math.sin(t*3)*4);
  }

  function drawSchoolRoad(t) {
    gradient('#c6e8ff','#d9efc9'); const horizon=H*.31;
    perspectiveRoad(horizon,W*.28,W*.28,18,'#efd2bd');
    for(let i=0;i<18;i++) { const p=i/17, yy=horizon+(H-horizon)*p, sp=W*.08+W*.31*p; flower(W/2-sp,yy,.2+p*.8,i%2?'#ff8aae':'#f8cf70'); flower(W/2+sp,yy,.2+p*.8,i%3?'#ff8aae':'#a993ff'); }
    const bw=Math.min(W*.52,560), bh=Math.min(H*.24,210), bx=W/2-bw/2, by=horizon-bh*.72;
    ctx.fillStyle='#f3d2a5'; roundedRect(bx,by,bw,bh,12); ctx.fill();
    ctx.fillStyle='#d9ecff'; for(let i=0;i<4;i++){roundedRect(bx+35+i*(bw-70)/4,by+50,42,58,5);ctx.fill();}
    sign('TRƯỜNG TIỂU HỌC HOA MÂY',W/2,by+28,Math.min(bw*.78,380),40,16,'#376b93');
    const move=(Math.sin(t*.7)*.5+.5); mascot(W/2,H*.72-move*8,.82,Math.sin(t*3)*3);
  }

  function drawHall(t) {
    gradient('#eaf3fa','#f2e6d8');
    const horizon=H*.28, cx=W/2+mouseX*20;
    ctx.fillStyle='#eadccb'; ctx.beginPath(); ctx.moveTo(cx-W*.1,horizon);ctx.lineTo(cx+W*.1,horizon);ctx.lineTo(W*.86,H);ctx.lineTo(W*.14,H);ctx.closePath();ctx.fill();
    ctx.strokeStyle='rgba(96,75,69,.18)'; ctx.lineWidth=4;
    for(let i=0;i<7;i++){const p=i/6, y=horizon+(H-horizon)*p; const span=W*.13+W*.34*p;ctx.beginPath();ctx.moveTo(cx-span,y);ctx.lineTo(cx+span,y);ctx.stroke();}
    for(let side of [-1,1]) for(let i=0;i<5;i++){const p=i/4, y=horizon+70+p*(H-horizon-120), x=cx+side*(W*.16+W*.28*p);ctx.fillStyle='#fff8ed';roundedRect(x-side*55,y-45,110,90,5);ctx.fill();}
    sign('LỚP HỌC YÊU THƯƠNG',W/2,H*.18,Math.min(W*.55,420),48,18,'#5a7773');
    mascot(W/2,H*.74,.84,Math.sin(t*3)*3);
  }

  function person(x,y,s,shirt,hair='#382820') {
    ctx.save();ctx.translate(x,y);ctx.scale(s,s);ctx.fillStyle=shirt;ctx.beginPath();ctx.ellipse(0,0,16,25,0,0,Math.PI*2);ctx.fill();ctx.fillStyle='#f3c7a8';ctx.beginPath();ctx.arc(0,-28,12,0,Math.PI*2);ctx.fill();ctx.fillStyle=hair;ctx.beginPath();ctx.arc(0,-33,12,Math.PI,0);ctx.fill();ctx.restore();
  }

  function drawClassroom(t) {
    gradient('#f3dfca','#d8b98e');
    ctx.fillStyle='#e4c3a1';ctx.fillRect(W*.08,H*.14,W*.84,H*.34);
    ctx.fillStyle='#3d6d5a';roundedRect(W*.25,H*.18,W*.5,H*.22,8);ctx.fill();
    ctx.fillStyle='#fff5df';ctx.font=`800 ${Math.min(30,W*.04)}px system-ui`;ctx.textAlign='center';ctx.fillText('Cảm ơn cô vì đã luôn ở đây!',W/2,H*.30);
    person(W/2,H*.54,1.7,'#f29db4');
    for(let r=0;r<3;r++) for(let c=0;c<5;c++){const x=W*.18+c*(W*.64/4), y=H*.66+r*68;ctx.fillStyle='#b98258';roundedRect(x-35,y-10,70,18,5);ctx.fill();person(x,y-20,.72,c%2?'#e8f3ff':'#fff');}
    mascot(W*.1,H*.80,.62,Math.sin(t*3)*2);
  }

  function drawDrive(t) {
    gradient('#f4b47f','#87686f'); const horizon=H*.32;
    perspectiveRoad(horizon,W*.24,W*.24,18,'#756e6d');
    ctx.strokeStyle='#f6e7a7';ctx.lineWidth=5;ctx.setLineDash([18,22]);ctx.beginPath();ctx.moveTo(W/2,horizon);ctx.lineTo(W/2,H);ctx.stroke();ctx.setLineDash([]);
    for(let i=0;i<10;i++) cloud(rnd(i+40)*W,60+rnd(i+50)*H*.25,.5+rnd(i+60),.4);
    const carY=H*.69+Math.sin(t*3)*2, cx=W/2+mouseX*18;
    ctx.fillStyle='rgba(0,0,0,.18)';ctx.beginPath();ctx.ellipse(cx,carY+62,75,17,0,0,Math.PI*2);ctx.fill();
    ctx.fillStyle='#ed8b91';roundedRect(cx-62,carY-5,124,68,14);ctx.fill();ctx.fillStyle='#9cc8d7';roundedRect(cx-40,carY-30,80,42,12);ctx.fill();
    ctx.fillStyle='#3b3436';for(const dx of [-48,48]){ctx.beginPath();ctx.arc(cx+dx,carY+55,16,0,Math.PI*2);ctx.fill();}
    mascot(cx,carY-35,.42,0);
  }

  function drawHome(t) {
    gradient('#82658b','#5c7652');
    const bw=Math.min(W*.62,650), bh=Math.min(H*.62,520), x=W/2-bw/2, y=H*.18;
    ctx.fillStyle='#f0ddc8';roundedRect(x,y,bw,bh,14);ctx.fill();
    ctx.fillStyle='#cda77d'; for(let f=1;f<3;f++) ctx.fillRect(x,y+f*bh/3,bw,9);
    for(let f=0;f<3;f++) for(let c=0;c<3;c++){ctx.fillStyle='#ffe7a3';roundedRect(x+55+c*(bw-110)/3,y+45+f*bh/3,54,48,7);ctx.fill();}
    person(W/2,H*.68,1.1,'#90a4b7');person(W/2-90,H*.49,.9,'#6aa6df');person(W/2+90,H*.49,.9,'#78b9e3');
    sign('Tầng 3 · Cây điều ước',W/2,H*.24,Math.min(320,W*.55),42,16,'#fff');
    mascot(W*.16,H*.78,.58,Math.sin(t*3)*3);
  }

  function branch(x1,y1,x2,y2,w) {ctx.strokeStyle='#7d5138';ctx.lineCap='round';ctx.lineWidth=w;ctx.beginPath();ctx.moveTo(x1,y1);ctx.lineTo(x2,y2);ctx.stroke();}
  function drawTree(t) {
    gradient('#cf9db1','#6f8d5f');
    const cx=W/2, base=H*.84, top=H*.18;
    branch(cx,base,cx,top+100,28);branch(cx,top+180,cx-W*.20,top+20,16);branch(cx,top+170,cx+W*.20,top+20,16);branch(cx,top+160,cx-W*.08,top-5,12);branch(cx,top+160,cx+W*.08,top-5,12);
    const clusters=[[-.26,.16],[-.13,.08],[0,.15],[.13,.08],[.26,.16],[-.06,.01],[.06,.01],[-.34,.19],[.34,.19]];
    clusters.forEach((p,i)=>{const x=cx+p[0]*W,y=top+p[1]*H;ctx.fillStyle='#b86f84';ctx.beginPath();ctx.ellipse(x,y,55,38,0,0,Math.PI*2);ctx.fill();if(bloom>0){for(let j=0;j<5;j++){const a=(j+i)*1.7;flower(x+Math.cos(a)*34,y+Math.sin(a)*22,.25+.35*bloom,['#ffabc4','#ffd3df','#fff0c7'][j%3]);}}});
    const wishes=['Sức khỏe dồi dào','Luôn hạnh phúc','Bình an mỗi ngày','Mãi luôn xinh đẹp'];
    wishes.forEach((w,i)=>{if(bloom>.35+i*.12){const a=i*Math.PI/2+.3;sign(w,cx+Math.cos(a)*Math.min(W*.31,270),H*.43+Math.sin(a)*100,180,38,13);}});
    mascot(W*.12,H*.80,.58,Math.sin(t*3)*2);
  }

  const drawers=[drawIntro,drawGarden,drawSchoolRoad,drawHall,drawClassroom,drawDrive,drawHome,drawTree];

  function setUI() {
    const s=STAGES[stage];
    ui.stageNumber.textContent=String(stage+1);
    ui.objectiveTitle.textContent=s[0]; ui.objectiveText.textContent=s[1]; ui.actionLabel.textContent=s[2];
  }

  let dialogueTimer=0;
  function showDialogue(name,text){
    ui.dialogueName.textContent=name;ui.dialogueText.textContent=text;ui.dialogue.classList.remove('hidden');
    clearTimeout(dialogueTimer);dialogueTimer=setTimeout(()=>ui.dialogue.classList.add('hidden'),3500);
  }

  function go(to) {
    if(transitionDir) return;
    nextStage=to; transitionDir=1; transition=0;
  }

  function advance() {
    if (transitionDir) return;
    if(stage===0){go(1);showDialogue('Mầm Nhỏ','Khu vườn trên mây đang chờ phía trước!');}
    else if(stage===1){go(2);showDialogue('Mầm Nhỏ','Theo con đường hoa nhé, trường của mẹ ở cuối đường.');}
    else if(stage===2){go(3);showDialogue('Mầm Nhỏ','Đến cổng trường rồi! Mình vào hành lang thôi.');}
    else if(stage===3){go(4);}
    else if(stage===4){ui.classPanel.classList.remove('hidden');ui.action.style.display='none';showDialogue('Mầm Nhỏ','Có rất nhiều lời chúc dành cho mẹ ở đây.');}
    else if(stage===5){go(6);showDialogue('Mầm Nhỏ','Về đến nhà rồi. Mọi người đang chờ mẹ!');}
    else if(stage===6){go(7);showDialogue('Mầm Nhỏ','Điều bất ngờ cuối cùng đang ở trên tầng 3.');}
    else if(stage===7){bloom=0.01;ui.action.disabled=true;}
  }

  ui.action.addEventListener('click',advance);
  canvas.addEventListener('pointerdown',()=>{if(ui.classPanel.classList.contains('hidden')&&ui.finalPanel.classList.contains('hidden')) advance();});
  ui.dismissClass.addEventListener('click',()=>{ui.classPanel.classList.add('hidden');ui.action.style.display='flex';stage=5;setUI();showDialogue('Mầm Nhỏ','Tan lớp rồi. Cùng mẹ về nhà nhé!');});
  ui.replay.addEventListener('click',()=>{ui.finalPanel.classList.add('hidden');ui.action.style.display='flex';ui.action.disabled=false;bloom=0;stage=0;setUI();showDialogue('Mầm Nhỏ','Mình bắt đầu lại nhé!');});
  window.addEventListener('pointermove',(e)=>{mouseX=(e.clientX/W-.5)*2;});
  window.addEventListener('resize',resize,{passive:true});
  window.addEventListener('keydown',(e)=>{if(e.key==='Enter'||e.key===' ') advance();});

  function frame(now) {
    const dt=Math.min(.05,(now-last)/1000); last=now; time+=dt;
    drawers[stage](time);

    if(transitionDir){
      transition += dt*2.5;
      const a=Math.min(1,transition);
      ctx.fillStyle=`rgba(255,249,244,${a})`;ctx.fillRect(0,0,W,H);
      if(transition>=1 && transitionDir===1){stage=nextStage;setUI();transition=1;transitionDir=-1;}
      else if(transitionDir===-1){transition-=dt*5;if(transition<=0){transition=0;transitionDir=0;nextStage=null;}}
    }

    if(stage===7 && bloom>0 && bloom<1){
      bloom=Math.min(1,bloom+dt*.34);
      if(bloom>=1){ui.action.style.display='none';ui.finalPanel.classList.remove('hidden');}
    }

    requestAnimationFrame(frame);
  }

  resize(); setUI();
  window.__APP_READY__=true;
  requestAnimationFrame(() => {
    ui.loading.classList.add('done');
    showDialogue('Mầm Nhỏ','Xin chào! Bản này dùng Canvas nhẹ, không còn phụ thuộc WebGL hay CDN 3D.');
    requestAnimationFrame(frame);
  });
})();
