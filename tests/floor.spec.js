import {test,expect} from '@playwright/test';
import {ROUTE_POINTS,onFloor,heightAt,sampleRoute} from '../src/scene-layout.js';
test('all walking paths stay on floors, reach door thresholds and have continuous scale',()=>{
 const ids=['school-front','school-hall','classroom','school-exit','car-boarding',null,'home-front','floor1','stairs','floor2older','floor2younger','stairs','wish-rooftop'];
 for(const [i,path]of Object.entries(ROUTE_POINTS)){
  for(let k=1;k<100;k++){
   const p=sampleRoute(path,k/100);expect(onFloor(ids[i],p.x,p.y),`${ids[i]} ${k}`).toBe(true);
   expect(heightAt(ids[i],p.y)).toBeGreaterThan(70);expect(heightAt(ids[i],p.y)).toBeLessThan(280);
  }
 }
 expect(onFloor('home-front',.43,.90)).toBe(false); // parked car, not an aisle
 expect(onFloor('floor1',.25,.58)).toBe(false); // furniture, not the floor
 expect(onFloor('stairs',.75,.85)).toBe(false); // outside the stair treads
});
