import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const out = 'artifacts/header-redesign';
await mkdir(out, {recursive:true});
const browser = await chromium.launch({channel:'msedge',headless:true});
const userId='22222222-2222-4222-8222-222222222222';
const profile={id:userId,full_name:'Saori Fujisaka',role:'student',status:'approved',student_id:'01234563210',year_section:'BS EMC 1-Y2-3',program:'Bachelor of Science in Entertainment and Multimedia Computing (BS EMC)'};
const user={id:userId,aud:'authenticated',role:'authenticated',email:'header-test@example.invalid',app_metadata:{provider:'email'},user_metadata:profile,created_at:'2026-01-01T00:00:00Z'};
const part=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
const session={access_token:`${part({alg:'HS256',typ:'JWT'})}.${part({sub:userId,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})}.fixture`,refresh_token:'local-fixture',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user};
const results=[];
try {
for(const width of [320,390,430,768]) {
 const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'no-preference'});
 await context.addInitScript(s=>localStorage.setItem('ccs-connect-auth',JSON.stringify(s)),session);
 await context.routeWebSocket(/.*/,s=>s.close());
 await context.route('**/auth/v1/**',r=>r.fulfill({json:r.request().url().includes('/token')?session:user}));
 await context.route('**/rest/v1/**',r=>r.fulfill({json:r.request().url().includes('/profiles')?profile:[]}));
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const variant of ['home','profile']) {
  await page.goto(`http://127.0.0.1:5173/app/${variant}`);
  await page.locator(`[data-header-background="${variant}"]`).waitFor();
  await page.locator('[data-startup-splash]').waitFor({state:'detached'});
  await page.waitForTimeout(350);
  const header=page.locator('.geometric-header');
  const info=await header.evaluate(async el=>{
   const bg=el.querySelector('.geometric-header-background');
   const animations=bg.getAnimations({subtree:true});
   await Promise.all(animations.map(a=>a.ready));
   const box=el.getBoundingClientRect();
   const tracks=animations.map(a=>{const t=a.effect.getTiming();return {duration:t.duration,iterations:t.iterations,frames:a.effect.getKeyframes()};});
   const clip=bg.getBoundingClientRect();
   const button=el.querySelector('button');const b=button.getBoundingClientRect();
   const hit=document.elementFromPoint(b.x+b.width/2,b.y+b.height/2);
   return {width:box.width,height:box.height,clip:{width:clip.width,height:clip.height},overflow:document.documentElement.scrollWidth>window.innerWidth,pointerEvents:getComputedStyle(bg).pointerEvents,hidden:bg.getAttribute('aria-hidden'),clickable:button===hit||button.contains(hit),tracks};
  });
  assert.equal(info.hidden,'true');assert.equal(info.pointerEvents,'none');assert.ok(info.clickable);
  assert.equal(info.overflow,false);assert.equal(info.width,info.clip.width);assert.equal(info.height,info.clip.height);
  assert.equal(info.tracks.length,5);
  for(const t of info.tracks){assert.ok(t.duration>=15000&&t.duration<=30000);assert.equal(t.iterations,Infinity);const f=t.frames[0],l=t.frames.at(-1);assert.equal(f.transform,l.transform);assert.equal(f.opacity,l.opacity);}
  const samples=await header.evaluate(el=>{
   const animations=el.querySelector('.geometric-header-background').getAnimations({subtree:true});
   return animations.map(a=>{
    const t=a.effect.getTiming();a.pause();a.currentTime=0;const first=getComputedStyle(a.effect.target).transform;
    a.currentTime=t.duration/2;const mid=getComputedStyle(a.effect.target).transform;
    a.currentTime=0;return {first,mid};
   });
  });
  assert.ok(samples.slice(0,4).every(s=>s.first!==s.mid));
  if(width===390) await page.screenshot({path:`${out}/${variant}-390.png`,fullPage:true});
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await header.evaluate(el=>el.querySelector('.geometric-header-background').getAnimations({subtree:true}).length),0);
  if(width===390) await header.screenshot({path:`${out}/${variant}-header-390.png`});
  await page.emulateMedia({reducedMotion:'no-preference'});
  results.push({variant,width,headerWidth:info.width,headerHeight:info.height,animations:info.tracks.map(t=>t.duration),checks:'clipping, pointer passthrough, seamless endpoints, moving transforms, reduced motion'});
  if(variant==='home'){await page.getByRole('button',{name:'Open profile',exact:true}).click();await page.waitForURL('**/app/profile');}
  else {await page.getByRole('button',{name:'Edit Profile',exact:true}).click();await page.waitForURL('**/app/profile/edit');}
 }
 assert.deepEqual(errors,[]);await context.close();
}
await writeFile(`${out}/web-checks.json`,JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
} finally {await browser.close();}
