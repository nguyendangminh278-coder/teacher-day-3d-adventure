// Normalized foot positions. Every point refers to the visible floor, not sprite center.
export const ROUTE_POINTS={
 0:[[.5,.92],[.5,.76],[.52,.60]],1:[[.28,.91],[.48,.79],[.65,.72],[.88,.68]],
 2:[[.65,.73],[.74,.75],[.91,.68]],3:[[.52,.60],[.5,.76],[.64,.93]],
 4:[[.38,.91],[.47,.92],[.54,.91]],6:[[.62,.90],[.59,.91],[.54,.86],[.51,.785]],
 7:[[.39,.87],[.48,.91],[.72,.91],[.82,.82]],
 8:[[.35,.92],[.38,.86],[.46,.75],[.54,.64],[.62,.53],[.70,.42],[.78,.31]],
 9:[[.29,.88],[.47,.91]],10:[[.47,.91],[.69,.91],[.82,.82]],
 11:[[.35,.92],[.38,.86],[.46,.75],[.54,.64],[.62,.53],[.70,.42],[.78,.31]],12:[[.25,.91]]
};
const rect=(l,t,r,b)=>[[l,t],[r,t],[r,b],[l,b]];
export const FLOORS={
 'school-front':[[[.35,.6],[.64,.6],[.72,.95],[.28,.95]]],
 'school-exit':[[[.35,.6],[.64,.6],[.76,.96],[.28,.96]]],
 'school-hall':[[[.25,.69],[.94,.65],[.91,.95],[.18,.95]]],
 classroom:[[[.60,.66],[.97,.60],[.97,.79],[.61,.79]]],
 'car-boarding':[rect(.33,.90,.55,.96)],
 'home-front':[[[.50,.78],[.56,.78],[.66,.93],[.56,.96],[.49,.88]]],
 floor1:[[[.35,.79],[.62,.79],[.85,.78],[.90,.96],[.33,.96]]],
 floor2older:[rect(.25,.81,.85,.96)],floor2younger:[rect(.30,.81,.85,.96)],
 stairs:[[[.30,.94],[.39,.97],[.84,.31],[.76,.25]]],
 'wish-rooftop':[rect(.10,.84,.85,.96)]
};
export function onFloor(id,x,y){
 return (FLOORS[id]||[]).some(poly=>{
  let inside=false;
  for(let i=0,j=poly.length-1;i<poly.length;j=i++){
   const [xi,yi]=poly[i],[xj,yj]=poly[j];
   if((yi>y)!==(yj>y)&&x<(xj-xi)*(y-yi)/(yj-yi)+xi)inside=!inside;
  }
  return inside;
 });
}
export function heightAt(id,y){
 if(id==='stairs')return 110+(y-.29)/.62*70;
 if(id.startsWith('floor'))return 190+(y-.75)*290;
 if(id==='classroom')return 190+(y-.66)*300;
 if(id==='home-front')return 145+(y-.785)/.145*35;
 return Math.max(90,90+(y-.60)/.33*90);
}
export function sampleRoute(points,t){
 const lengths=points.slice(1).map((p,i)=>Math.hypot((p[0]-points[i][0])*1672,(p[1]-points[i][1])*941));
 let d=Math.min(1,Math.max(0,t))*lengths.reduce((a,b)=>a+b,0);
 for(let i=0;i<lengths.length;i++){
  if(d<=lengths[i]||i===lengths.length-1){const k=lengths[i]?d/lengths[i]:0,a=points[i],b=points[i+1];return {x:a[0]+(b[0]-a[0])*k,y:a[1]+(b[1]-a[1])*k,dx:b[0]-a[0],dy:b[1]-a[1]};}
  d-=lengths[i];
 }
 return {x:points[0][0],y:points[0][1],dx:0,dy:0};
}
