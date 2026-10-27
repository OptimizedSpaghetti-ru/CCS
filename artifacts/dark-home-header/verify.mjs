import assert from 'node:assert/strict';
import { mkdir, writeFile } from 'node:fs/promises';
import { chromium } from 'playwright';
const out = 'artifacts/dark-home-header';
await mkdir(out, {recursive:true});
const browser = await chromium.launch({channel:'msedge',headless:true});
const userId='22222222-2222-4222-8222-222222222222';
let profile={id:userId,full_name:'Saori Fujisaka',role:'student',status:'approved',student_id:'01234563210',year_section:'BS EMC 1-Y2-3',program:'Bachelor of Science in Entertainment and Multimedia Computing (BS EMC)'};
let user={id:userId,aud:'authenticated',role:'authenticated',email:'header-test@example.invalid',app_metadata:{provider:'email'},user_metadata:profile,created_at:'2026-01-01T00:00:00Z'};
const part=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
const session={access_token:`${part({alg:'HS256',typ:'JWT'})}.${part({sub:userId,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})}.fixture`,refresh_token:'local-fixture',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user};
const results=[];
try {
for(const [role,width] of [['student',320],['faculty',390],['it_support',430],['admin',390],['admin',768]]) {
 profile={...profile,role,full_name:role==='admin'?'CCS Administrator':role==='it_support'?'IT Support':role==='faculty'?'Faculty Member':'Student Name'};
 user={...user,user_metadata:profile};session.user=user;
 const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'no-preference'});
 await context.addInitScript(s=>{localStorage.setItem('ccs-connect-auth',JSON.stringify(s));if(!localStorage.getItem('ccs-theme-preference'))localStorage.setItem('ccs-theme-preference','dark');},session);
 await context.routeWebSocket(/.*/,s=>s.close());
 await context.route('**/auth/v1/**',r=>r.fulfill({json:r.request().url().includes('/token')?session:user}));
 await context.route('**/rest/v1/**',r=>r.fulfill({json:r.request().url().includes('/profiles')?profile:[]}));
 const page=await context.newPage();const errors=[];page.on('pageerror',e=>errors.push(e.message));
 for(const variant of ['home']) {
  await page.goto(`http://127.0.0.1:5176/app/${variant}`);
  await page.locator(`[data-header-background="${variant}-dark"]`).waitFor();
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
  await page.screenshot({path:`${out}/${role}-${width}.png`});
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await header.evaluate(el=>el.querySelector('.geometric-header-background').getAnimations({subtree:true}).length),0);
  await header.screenshot({path:`${out}/${role}-header-${width}.png`});
  await page.emulateMedia({reducedMotion:'no-preference'});
  results.push({role,variant,width,headerWidth:info.width,headerHeight:info.height,animations:info.tracks.map(t=>t.duration),checks:'clipping, pointer passthrough, seamless endpoints, moving transforms, reduced motion'});
  const darkLayout=await header.evaluate(el=>({height:el.getBoundingClientRect().height,contents:[...el.querySelectorAll('h1,p,button')].map(e=>e.textContent)}));
  await page.evaluate(()=>localStorage.setItem('ccs-theme-preference','light'));
  await page.reload();
  await page.locator('[data-header-background="home"]').waitFor();
  await page.locator('[data-startup-splash]').waitFor({state:'detached'});
  const lightLayout=await header.evaluate(el=>({height:el.getBoundingClientRect().height,contents:[...el.querySelectorAll('h1,p,button')].map(e=>e.textContent)}));
  assert.deepEqual(lightLayout,darkLayout,'theme preserves header dimensions and role content');
  assert.equal(await page.locator('[data-header-background="home-dark"]').count(),0);
  await page.getByRole('button',{name:'Open profile',exact:true}).click();
  await page.waitForURL('**/app/profile');
  await page.locator('[data-header-background="profile"]').waitFor();
  if(role==='admin' && width===390) {
    for(const theme of ['Dark','Light']) {
      await page.goto('http://127.0.0.1:5176/app/settings');
      await page.locator('[data-startup-splash]').waitFor({state:'detached'});
      await page.getByRole('button',{name:theme,exact:true}).click();
      await page.getByRole('button',{name:'Home',exact:true}).click();
      await page.locator(`[data-header-background="${theme==='Dark'?'home-dark':'home'}"]`).waitFor();
    }
  }
  console.log(`PASS ${role} ${width}px: shared dark Home artwork, animation, reduced motion, role content, light layout, profile link.`);

 }
 assert.deepEqual(errors,[]);await context.close();
}
await writeFile(`${out}/web-checks.json`,JSON.stringify(results,null,2));
console.log(JSON.stringify(results,null,2));
} finally {await browser.close();}
