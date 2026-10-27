import assert from 'node:assert/strict';
import {execFileSync} from 'node:child_process';
import {mkdir,writeFile} from 'node:fs/promises';
import path from 'node:path';
import {chromium} from 'playwright';
const adbPath=path.join(process.env.LOCALAPPDATA,'Android/Sdk/platform-tools/adb.exe');
const adb=(...args)=>execFileSync(adbPath,args,{encoding:'utf8',windowsHide:true}).trim();
assert.match(adb('get-serialno'),/^emulator-/);
const appId='com.ccs.connect';
console.log(adb('install','-r','android/app/build/outputs/apk/debug/app-debug.apk'));
adb('shell','am','start','-n',`${appId}/.MainActivity`);
let browser,page;
for(let attempt=0;attempt<40&&!page;attempt++){
 try{const pid=adb('shell','pidof','-s',appId);adb('forward','tcp:9223',`localabstract:webview_devtools_remote_${pid}`);browser=await chromium.connectOverCDP('http://127.0.0.1:9223',{timeout:1000});page=browser.contexts().flatMap(c=>c.pages())[0];}
 catch{await new Promise(r=>setTimeout(r,250));}
}
assert.ok(page);page.setDefaultTimeout(15000);
const saved=await page.evaluate(async()=>({native:(await window.Capacitor.Plugins.Preferences.get({key:'ccs-connect-auth'})).value,web:localStorage.getItem('ccs-connect-auth'),theme:localStorage.getItem('ccs-theme-preference'),url:location.href}));
const userId='22222222-2222-4222-8222-222222222222';
let profile={id:userId,full_name:'Saori Fujisaka',role:'student',status:'approved',student_id:'01234563210',year_section:'BS EMC 1-Y2-3'};
let user={id:userId,aud:'authenticated',role:'authenticated',email:'header-test@example.invalid',app_metadata:{provider:'email'},user_metadata:profile,created_at:'2026-01-01T00:00:00Z'};
const part=v=>Buffer.from(JSON.stringify(v)).toString('base64url');
const session={access_token:`${part({alg:'HS256',typ:'JWT'})}.${part({sub:userId,exp:Math.floor(Date.now()/1000)+3600,role:'authenticated'})}.fixture`,refresh_token:'local-fixture',token_type:'bearer',expires_in:3600,expires_at:Math.floor(Date.now()/1000)+3600,user};
const context=page.context();
await context.routeWebSocket(/.*/,s=>s.close());
const fixture=r=>r.fulfill({json:r.request().url().includes('/profiles')?profile:r.request().url().includes('/token')?session:r.request().url().includes('/auth/')?user:[]});
await context.route('**/auth/v1/**',fixture);await context.route('**/rest/v1/**',fixture);
const results=[];await mkdir('artifacts/dark-home-header',{recursive:true});
try {
 for(const role of ['student','faculty','it_support','admin']){
  const variant='home';
  profile={...profile,role,full_name:role==='admin'?'CCS Administrator':role==='faculty'?'Faculty Member':role==='it_support'?'IT Support':'Student Name'};
  user={...user,user_metadata:profile};session.user=user;
  await page.evaluate(async value=>{await window.Capacitor.Plugins.Preferences.set({key:'ccs-connect-auth',value});localStorage.setItem('ccs-connect-auth',value);localStorage.setItem('ccs-theme-preference','dark');},JSON.stringify(session));
  await page.goto(`https://localhost/app/${variant}`);
  await page.locator(`[data-header-background="${variant}-dark"]`).waitFor();
  await page.locator('[data-startup-splash]').waitFor({state:'detached'});
  await page.waitForTimeout(900);
  const header=page.locator('.geometric-header');
  const before=await header.evaluate(el=>({height:el.getBoundingClientRect().height,tracks:el.querySelector('.geometric-header-background').getAnimations({subtree:true}).map(a=>({time:a.currentTime,duration:a.effect.getTiming().duration,state:a.playState})),platform:window.Capacitor.getPlatform()}));
  assert.equal(before.platform,'android');assert.equal(before.tracks.length,5);assert.ok(before.tracks.every(t=>t.state==='running'&&t.duration>=15000&&t.duration<=30000));
  await page.waitForTimeout(300);
  const after=await header.evaluate(el=>el.querySelector('.geometric-header-background').getAnimations({subtree:true}).map(a=>a.currentTime));
  assert.ok(after.every((t,i)=>t>before.tracks[i].time));
  await header.evaluate(el=>el.querySelector('.geometric-header-background').getAnimations({subtree:true}).forEach(a=>{a.pause();a.currentTime=0;}));
  await page.waitForTimeout(200);await writeFile(`artifacts/dark-home-header/android-${role}.png`,execFileSync(adbPath,['exec-out','screencap','-p'],{windowsHide:true}));console.log(JSON.stringify(await header.evaluate(el=>[...el.querySelectorAll('h1,h2,p,button')].map(e=>({text:e.textContent,width:e.getBoundingClientRect().width,transform:getComputedStyle(e).transform,parentWidth:e.parentElement.getBoundingClientRect().width,parentTransform:getComputedStyle(e.parentElement).transform})))));
  await page.emulateMedia({reducedMotion:'reduce'});
  assert.equal(await header.evaluate(el=>el.querySelector('.geometric-header-background').getAnimations({subtree:true}).length),0);
  await page.emulateMedia({reducedMotion:'no-preference'});
  if(variant==='home'){await page.getByRole('button',{name:'Open profile',exact:true}).click();await page.waitForURL('**/app/profile');}
  else{await page.getByRole('button',{name:'Edit Profile',exact:true}).click();await page.waitForURL('**/app/profile/edit');}
  results.push({role,variant,...before,motionAdvances:true,reducedMotion:true,buttonsWork:true});
 }
 await writeFile('artifacts/dark-home-header/android-checks.json',JSON.stringify(results,null,2));console.log(JSON.stringify(results,null,2));
}finally{
 await page.evaluate(async saved=>{const p=window.Capacitor.Plugins.Preferences;if(saved.native===null)await p.remove({key:'ccs-connect-auth'});else await p.set({key:'ccs-connect-auth',value:saved.native});if(saved.web===null)localStorage.removeItem('ccs-connect-auth');else localStorage.setItem('ccs-connect-auth',saved.web);if(saved.theme===null)localStorage.removeItem('ccs-theme-preference');else localStorage.setItem('ccs-theme-preference',saved.theme);},saved);
 await context.unroute('**/auth/v1/**',fixture);await context.unroute('**/rest/v1/**',fixture);
 await page.emulateMedia({reducedMotion:null});
 await page.goto(saved.url).catch(()=>{});await browser.close();adb('forward','--remove','tcp:9223');
 console.log('Restored original emulator authentication, theme, and route.');
}
