import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {writeFile,unlink} from 'node:fs/promises';
import {chromium} from 'playwright';
import {PNG} from 'pngjs';
const paths=['Home','Profile'].map(n=>`src/app/screens/__HeaderBaseline${n}.tsx`);
const browser=await chromium.launch({channel:'msedge',headless:true});
const userId='22222222-2222-4222-8222-222222222222';
const profile={id:userId,full_name:'Saori Fujisaka',role:'student',status:'approved',student_id:'01234563210',year_section:'BS EMC 1-Y2-3'};
const user={id:userId,aud:'authenticated',role:'authenticated',email:'header-test@example.invalid',app_metadata:{provider:'email'},user_metadata:profile,created_at:'2026-01-01T00:00:00Z'};
const part=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
const session={access_token:`${part({alg:'HS256',typ:'JWT'})}.${part({sub:userId,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})}.fixture`,refresh_token:'local-fixture',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user};
const results=[];
try {
 for(const name of ['Home','Profile']) await writeFile(`src/app/screens/__HeaderBaseline${name}.tsx`,execFileSync('git',['show',`HEAD:src/app/screens/${name}.tsx`]));
 for(const [width,theme] of [[320,'light'],[390,'light'],[430,'light'],[390,'dark']]) {
  const renders={};
  for(const baseline of [false,true]) {
   const context=await browser.newContext({viewport:{width,height:844},reducedMotion:'reduce'});
   await context.addInitScript(({session,theme})=>{localStorage.setItem('ccs-connect-auth',JSON.stringify(session));localStorage.setItem('ccs-theme-preference',theme);},{session,theme});
   await context.routeWebSocket(/.*/,s=>s.close());
   await context.route('**/auth/v1/**',r=>r.fulfill({json:user}));
   await context.route('**/rest/v1/**',r=>r.fulfill({json:r.request().url().includes('/profiles')?profile:[]}));
   if(baseline) await context.route(/\/src\/app\/screens\/(Home|Profile)\.tsx(?:\?.*)?$/,async r=>{
    const name=r.request().url().match(/\/(Home|Profile)\.tsx/)[1];
    const res=await fetch(`http://127.0.0.1:5173/src/app/screens/__HeaderBaseline${name}.tsx`);
    assert.ok(res.ok);await r.fulfill({body:await res.text(),contentType:'application/javascript'});
   });
   const page=await context.newPage();
   for(const variant of ['home','profile']) {
    await page.goto(`http://127.0.0.1:5173/app/${variant}`);
    await page.getByRole('heading',{name:variant==='home'?'Saori':'Saori Fujisaka',exact:true}).waitFor();
    await page.locator('[data-startup-splash]').waitFor({state:'detached'});
    await page.evaluate(()=>document.fonts.ready);await page.waitForTimeout(900);
    const layout=await page.evaluate(variant=>{
     const heading=document.querySelector(variant==='home'?'h1':'h2');
     const header=heading.closest('div[style*="overflow: hidden"]');
     const rect=e=>{const r=e.getBoundingClientRect();return {x:r.x,y:r.y,width:r.width,height:r.height};};
     return {header:rect(header),content:[...header.querySelectorAll('h1,h2,p,button,img')].map(e=>({tag:e.tagName,text:e.textContent,box:rect(e)}))};
    },variant);
    renders[`${variant}-${baseline}`]={layout,png:PNG.sync.read(await page.screenshot())};
   }
   await context.close();
  }
  for(const variant of ['home','profile']) {
   const old=renders[`${variant}-true`],current=renders[`${variant}-false`];
   assert.deepEqual(current.layout,old.layout,'Header size, text, avatar and button placement must stay identical');
   const boundary=Math.ceil(old.layout.header.y+old.layout.header.height);
   let changed=0, maxChannelDelta=0, materiallyChanged=0;
   for(let i=boundary*old.png.width*4;i<old.png.data.length;i++) {
    const delta=Math.abs(old.png.data[i]-current.png.data[i]);
    if(delta)changed++;
    maxChannelDelta=Math.max(maxChannelDelta,delta);
    if(delta>2)materiallyChanged++;
   }
   // The pre-existing bottom-nav dot has up to 2/255 rasterization variation.
   // Keep a strict layout comparison and permit only that subpixel color tolerance.
   assert.equal(materiallyChanged,0,'Outside-header pixels must match within 2/255 antialiasing tolerance');
   results.push({variant,width,theme,headerHeight:current.layout.header.height,changedChannelsOutsideHeader:changed,maxChannelDelta,materiallyChangedChannels:materiallyChanged,layoutIdentical:true});
  }
 }
 await writeFile('artifacts/header-redesign/layout-checks.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
} finally {await browser.close();for(const p of paths) await unlink(p).catch(()=>{});}
