import {ROUTES,ROUTE_SPACES,COLLIDERS,DESKS} from '../src/world-spec.mjs';

const solids=[...COLLIDERS,...DESKS];
const AVATAR_RADIUS=.55;
const SAMPLE=.16;
function lerp(a,b,t){return a.map((v,i)=>v+(b[i]-v)*t)}
function inside(p,b){return p[0]>b.min[0]-AVATAR_RADIUS&&p[0]<b.max[0]+AVATAR_RADIUS&&p[1]>b.min[1]-.05&&p[1]<b.max[1]+.1&&p[2]>b.min[2]-AVATAR_RADIUS&&p[2]<b.max[2]+AVATAR_RADIUS}

let errors=[];let samples=0;
for(const [name,pts] of Object.entries(ROUTES)){
  const space=ROUTE_SPACES[name]||'outdoor';
  const scoped=solids.filter(s=>(s.space||'outdoor')===space);
  for(let i=0;i<pts.length-1;i++){
    const a=pts[i],b=pts[i+1];
    const len=Math.hypot(b[0]-a[0],b[1]-a[1],b[2]-a[2]);
    const n=Math.max(1,Math.ceil(len/SAMPLE));
    for(let j=0;j<=n;j++){
      const p=lerp(a,b,j/n);samples++;
      for(const c of scoped){
        if(inside(p,c)){
          errors.push(`${name} [${space}] intersects ${c.name} near (${p.map(v=>v.toFixed(2)).join(', ')})`);
          break;
        }
      }
    }
  }
}
if(errors.length){console.error('ROUTE QA FAILED');console.error([...new Set(errors)].join('\n'));process.exit(1)}
console.log(`ROUTE QA PASS: ${Object.keys(ROUTES).length} routes, ${samples} samples across isolated spaces, ${solids.length} solids, avatar radius ${AVATAR_RADIUS}m.`);
