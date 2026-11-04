// Assets are local, without baked UI. Each atlas cell is a distinct illustration.
const sources = ['village.png', 'story-atlas.png', 'details-atlas.png', 'family.png'];
const images = [];
export async function loadIllustrations() {
  await Promise.all(sources.map((name, i) => new Promise((resolve, reject) => {
    const img = new Image(); images[i] = img;
    img.onload = resolve;
    img.onerror = () => reject(new Error(`Không tải được hình ảnh ${name}. Hãy tải lại trang.`));
    img.src = new URL(`../assets/illustrations/${name}`, import.meta.url).href;
  })));
}
const cells = {
  'school-front': [1, 0, 0, 2, 3], 'school-exit': [1, 0, 0, 2, 3],
  classroom: [1, 1, 0, 2, 3], 'car-driving': [1, 0, 1, 2, 3],
  floor1: [1, 1, 1, 2, 3], floor2older: [1, 0, 2, 2, 3],
  floor2younger: [1, 0, 2, 2, 3], 'wish-rooftop': [1, 1, 2, 2, 3],
  'school-hall': [2, 0, 0, 2, 2], 'home-front': [2, 1, 0, 2, 2],
  'car-boarding': [2, 0, 1, 2, 2], stairs: [2, 1, 1, 2, 2],
};
function drawCharacter(ctx, x, feet, scale, t, who = 'mother', walk = false) {
  const source = images[3], col = { dad: 0, older: 1, younger: 2, mother: 3 }[who];
  const sw = source.naturalWidth / 4, sh = source.naturalHeight;
  const h = scale * 75, w = h * sw / sh;
  const bob = walk ? Math.sin(t * 12) * 2 : 0;
  ctx.save();
  ctx.fillStyle = '#243c3270';ctx.beginPath();ctx.ellipse(x, feet, w*.27, 5, 0, 0, Math.PI*2);ctx.fill();
  ctx.drawImage(source, col * sw, 0, sw, sh, x-w/2, feet-h*.96+bob, w, h);
  ctx.restore();
}
function background(ctx, W, H, cell) {
  const [img, col, row, cols, rows] = cell, source = images[img];
  const sw = source.naturalWidth / cols, sh = source.naturalHeight / rows;
  ctx.drawImage(source, col * sw, row * sh, sw, sh, 0, 0, W, H);
}
function petals(ctx, W, H, t, quiet) {
  if (quiet) return;
  ctx.fillStyle = '#ffd6e8';
  for (let i = 0; i < 16; i++) {
    const x = (i * 137 + t * 17 + Math.sin(t + i) * 16) % W;
    const y = (i * 61 + t * 23) % H;
    ctx.globalAlpha = .4 + (i % 3) * .15;
    ctx.fillRect(Math.round(x), Math.round(y), 5, 3);
  }
  ctx.globalAlpha = 1;
}
export function drawRpgOverworld(ctx, W, H, t, actor, car, quiet) {
  ctx.drawImage(images[0], 0, 0, W, H);
  petals(ctx, W, H, t, quiet);
  if (actor.visible) {
    drawCharacter(ctx, actor.x - 99, actor.y - 5, 1.5, t, 'dad', actor.walking);
    drawCharacter(ctx, actor.x - 65, actor.y + 3, 1.35, t, 'older', actor.walking);
    drawCharacter(ctx, actor.x - 33, actor.y + 3, 1.25, t, 'younger', actor.walking);
    drawCharacter(ctx, actor.x, actor.y, 1.5, t, 'mother', actor.walking);
    // Quest marker stays attached to the player.
    ctx.fillStyle = '#ffe6a1'; ctx.strokeStyle = '#533820'; ctx.lineWidth = 3;
    ctx.beginPath(); ctx.roundRect(actor.x - 17, actor.y - 133, 34, 39, 7); ctx.fill(); ctx.stroke();
    ctx.fillStyle = '#50321c'; ctx.font = 'bold 28px Georgia'; ctx.textAlign = 'center';
    ctx.fillText('!', actor.x, actor.y - 104);
  }
}
export function drawStoryLocation(ctx, W, H, id, t, selected, count, quiet) {
  background(ctx, W, H, cells[id]);
  const elapsed = Math.max(0, performance.now() - window.__finePixelArrival) / 1000;
  let x = W * .43, y = H * .84;
  if (id === 'classroom') { x = W * .65; y = H * .73; }
  if (id.startsWith('floor2')) { x = W * .75; y = H * .91; }
  if (id === 'school-exit') x = W * (.46 + Math.min(1, elapsed / 2) * .12);
  if (id === 'car-boarding') { x = W * .32; y = H * .88; }
  if (id === 'stairs') {
    const p = quiet ? .7 : Math.min(1, elapsed / 2.6);
    x = W * (.24 + p * .33); y = H * (.94 - p * .65);
  }
  if (id === 'wish-rooftop') { x = W * .25; y = H * .91; }
  if (id !== 'car-driving') drawCharacter(ctx, x, y, id === 'classroom' || id.startsWith('floor') ? 3.2 : 1.9, t, 'mother', id === 'stairs' || id === 'school-exit');
  else if (!quiet) {
    // Moving light and road streaks make the travel interval visible.
    ctx.fillStyle = '#fff6c8'; ctx.globalAlpha = .45;
    for (let i = 0; i < 9; i++) ctx.fillRect((W + i * 213 - t * 290 % W) % W, H * .89 + (i % 3) * 9, 38, 3);
    ctx.globalAlpha = 1;
  }
  const hits = [];
  if (id === 'wish-rooftop') {
    for (let i = 0; i < count; i++) {
      const a = i * 2.39996, r = 45 + (i % 6) * 35;
      const px = W * .52 + Math.cos(a) * r, py = H * .40 + Math.sin(a) * r * .66;
      hits.push({ x: px, y: py, index: i });
      ctx.fillStyle = selected === i ? '#fff8d7' : '#ffadd5';
      for (const [dx,dy] of [[-7,0],[7,0],[0,-7],[0,7]]) {
        ctx.beginPath();ctx.arc(px+dx,py+dy,6,0,Math.PI*2);ctx.fill();
      }
      ctx.fillStyle='#ffe395';ctx.fillRect(px-3,py-3,6,6);
    }
    petals(ctx, W, H, t, quiet);
  }
  return hits;
}
