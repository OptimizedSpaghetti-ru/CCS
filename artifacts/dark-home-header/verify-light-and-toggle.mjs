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
import { execFileSync } from 'node:child_process';
import { unlink } from 'node:fs/promises';
const baselineFile='src/app/components/__DarkHomeHeaderBaseline.tsx';
await writeFile(baselineFile,execFileSync('git',['show','HEAD:src/app/components/GeometricHeaderBackground.tsx']));
let context;
try {
 context=await browser.newContext({viewport:{width:390,height:844},reducedMotion:'reduce'});
 await context.addInitScript(session=>{localStorage.setItem('ccs-connect-auth',JSON.stringify(session));if(!localStorage.getItem('ccs-theme-preference'))localStorage.setItem('ccs-theme-preference','light');},session);
 await context.routeWebSocket(/.*/,s=>s.close());
 await context.route('**/auth/v1/**',r=>r.fulfill({json:user}));
 await context.route('**/rest/v1/**',r=>r.fulfill({json:r.request().url().includes('/profiles')?profile:[]}));
 const page=await context.newPage();
 const openHome=async()=>{
   await page.goto('http://127.0.0.1:5176/app/home');
   await page.locator('[data-startup-splash]').waitFor({state:'detached'});
   await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(300);
 };
 await openHome();
 const current=await page.locator('.geometric-header').screenshot();
 const baselineRoute=async r=>{
   const response=await fetch('http://127.0.0.1:5176/src/app/components/__DarkHomeHeaderBaseline.tsx');
   assert.ok(response.ok);await r.fulfill({body:await response.text(),contentType:'application/javascript'});
 };
 const matcher=/\/src\/app\/components\/GeometricHeaderBackground\.tsx(?:\?.*)?$/;
 await context.route(matcher,baselineRoute);
 await openHome();
 const baseline=await page.locator('.geometric-header').screenshot();
 assert.ok(current.equals(baseline),'light header must be pixel-identical to original');
 await context.unroute(matcher,baselineRoute);
 for(const theme of ['Dark','Light','Dark']) {
   await page.goto('http://127.0.0.1:5176/app/settings');
   await page.locator('[data-startup-splash]').waitFor({state:'detached'});
   await page.getByRole('button',{name:theme,exact:true}).click();
   await page.getByRole('button',{name:'Home',exact:true}).click();
   await page.locator(`[data-header-background="${theme==='Dark'?'home-dark':'home'}"]`).waitFor();
 }
 await writeFile('artifacts/dark-home-header/baseline-checks.json',JSON.stringify({lightHeaderPixelIdentical:true,liveThemeSwitch:true},null,2));
 console.log('PASS light Home header is pixel-identical to the original; Settings Dark/Light/Dark switches the artwork correctly.');
}finally {
 if(context)await context.close();await browser.close();await unlink(baselineFile);
}
