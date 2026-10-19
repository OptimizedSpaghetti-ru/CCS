// Optional browser verification tooling; no production dependency is required.
// Set CCS_PLAYWRIGHT_MODULE to a Playwright index.mjs file URL if installed outside this repo.
import assert from 'node:assert/strict';
const { chromium } = await import(process.env.CCS_PLAYWRIGHT_MODULE || 'playwright');
const baseURL = process.env.CCS_SPLASH_URL || 'http://127.0.0.1:5173/';
{
const browser = await chromium.launch({channel:'msedge', headless:true});
try {
 const page = await browser.newPage({viewport:{width:390,height:844}});
 await page.goto(baseURL);
 const video=page.locator('video');
 await video.waitFor({timeout:10000});
 assert.equal(await video.evaluate(v=>v.muted && v.autoplay && v.playsInline && !v.controls && !v.loop),true);
 await page.getByRole('button',{name:'Log In',exact:true}).waitFor();
 await video.waitFor({state:'detached'}); assert.equal(await video.count(),0);
 await page.getByRole('button',{name:'Log In',exact:true}).click();
 await page.waitForURL('**/login');
 await video.waitFor({state:'detached'}); assert.equal(await video.count(),0);
 await page.reload();
 await video.waitFor();
 await page.waitForURL(baseURL);
 await page.getByRole('button',{name:'Log In',exact:true}).waitFor();
 console.log('PASS: local playback, welcome, navigation without replay, fresh launch replay');
 await page.route('**/ccs-connect-splash.mp4',r=>r.abort());
 await page.reload();
 await page.getByRole('button',{name:'Log In',exact:true}).waitFor();
 await video.waitFor({state:'detached'}); assert.equal(await video.count(),0);
 console.log('PASS: video load failure falls back to welcome');
} finally { await browser.close(); }



}
{
const browser=await chromium.launch({channel:'msedge',headless:true});
const tokenPart=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
const userId='11111111-1111-4111-8111-111111111111';
const user={id:userId,aud:'authenticated',role:'authenticated',email:'splash-test@example.invalid',app_metadata:{provider:'email'},user_metadata:{full_name:'Splash Test',role:'student',status:'approved'},created_at:'2026-01-01T00:00:00Z'};
const session={access_token:`${tokenPart({alg:'HS256',typ:'JWT'})}.${tokenPart({sub:userId,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})}.fixture`,refresh_token:'local-fixture',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user};
try {
 for (const status of ['approved','pending']) {
  const context=await browser.newContext({viewport:{width:390,height:844}});
  await context.addInitScript(s=>localStorage.setItem('ccs-connect-auth',JSON.stringify(s)),session);
  await context.route('**/auth/v1/**',r=>r.fulfill({json:user}));
  await context.route('**/rest/v1/**',async r=>{
   const profile=r.request().url().includes('/profiles');
   if(profile) await new Promise(resolve=>setTimeout(resolve,4000));
   await r.fulfill({json:profile?{id:userId,full_name:'Splash Test',role:'student',status}:[]});
  });
  const page=await context.newPage();
  await page.goto(baseURL);
  await page.locator('video').waitFor();
  await page.waitForFunction(()=>document.querySelector('video')?.ended);
  assert.equal(await page.locator('video').count(),1,'Must retain final frame while session/profile initializes');
  assert.equal(await page.getByRole('button',{name:'Log In',exact:true}).count(),0,'No welcome flicker during auth');
  await page.waitForURL(`**/${status==='approved'?'app/home':'pending-approval'}`);
  await page.locator('video').waitFor({state:'detached'});
  assert.ok(await page.evaluate(()=>localStorage.getItem('ccs-connect-auth')),'Must preserve session');
  console.log(`PASS: delayed restored ${status} session waits behind video, routes correctly and persists`);
  await context.close();
 }
 const page=await browser.newPage();
 await page.addInitScript(()=>{HTMLMediaElement.prototype.play=function(){return Promise.reject(new DOMException('Blocked','NotAllowedError'));};});
 await page.goto(baseURL);
 await page.getByRole('button',{name:'Log In',exact:true}).waitFor();
 await page.locator('video').waitFor({state:'detached'});
 console.log('PASS: rejected autoplay falls back without blocking startup');
} finally {await browser.close();}

}
{
const browser=await chromium.launch({channel:'msedge',headless:true});
try {
 const page=await browser.newPage({viewport:{width:390,height:844}});
 await page.goto(baseURL);
 await page.locator('video').waitFor();
 await page.waitForFunction(()=>document.querySelector('video')?.currentTime>0.1);
 const before=await page.evaluate(()=>{
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>true});
  document.dispatchEvent(new Event('visibilitychange'));
  return document.querySelector('video').currentTime;
 });
 await page.waitForTimeout(500);
 assert.equal(await page.locator('video').evaluate(v=>v.paused),true);
 const resumed=await page.evaluate(()=>{
  Object.defineProperty(document,'hidden',{configurable:true,get:()=>false});
  document.dispatchEvent(new Event('visibilitychange'));
  return document.querySelector('video').currentTime;
 });
 assert.ok(resumed>=before,'Resume must preserve playback position');
 await page.locator('video').waitFor({state:'detached'});
 await page.evaluate(()=>document.dispatchEvent(new Event('visibilitychange')));
 assert.equal(await page.locator('video').count(),0);
 console.log('PASS: simulated background/resume preserves position and does not replay completed splash');
 const stalled=await browser.newPage();
 await stalled.addInitScript(()=>{HTMLMediaElement.prototype.play=function(){this.pause();return Promise.resolve();};});
 await stalled.goto(baseURL);
 await stalled.getByRole('button',{name:'Log In',exact:true}).waitFor({timeout:20000});
 await stalled.locator('video').waitFor({state:'detached'});
 console.log('PASS: stalled playback releases startup via fallback');
} finally {await browser.close();}

}
