import assert from 'node:assert/strict';
import {chromium} from 'playwright';
import {blockEgress} from '../../tools/design/lib/serve.mjs';
const b=await chromium.launch();const out=new URL('./shots', import.meta.url).pathname;
const identity=p=>p.evaluate(()=>JSON.parse(decodeURIComponent(document.cookie.split('; ').find(x=>x.startsWith('pl_user='))?.slice(8)||'{}')));
try {for(const role of ['CASE_OWNER','PHOTON_ADMIN']) {
 const c=await b.newContext({viewport:{width:1440,height:900}});await blockEgress(c);const p=await c.newPage();p.on('response',async r=>{if(r.url().includes('view-as')) console.log(r.status(),r.url(),await r.text().catch(()=>''));});
 await p.goto(`http://127.0.0.1:3740/?scenario=v0/my-work/new-approved-idea&role=${role}`);
 let original;
 if(role==='CASE_OWNER') await p.getByRole('link',{name:'Open this client workspace',exact:false}).click();
 else {await p.getByRole('link',{name:'Clients',exact:true}).click();await p.getByText('Northwind Instruments',{exact:true}).last().click();}
 original=await identity(p);await p.getByRole('button',{name:'View as client',exact:true}).click();
 await p.evaluate(()=>{const sel=JSON.parse(localStorage.getItem('pulse-design.selection'));sel.persona=null;localStorage.setItem('pulse-design.selection',JSON.stringify(sel));});
 await p.getByRole('button',{name:'Proceed',exact:true}).click();
 const exit=p.getByRole('button',{name:'Exit client view',exact:true});await exit.waitFor();assert.equal((await identity(p)).role,'LEGAL_COUNSEL');
 if(role==='CASE_OWNER') {
  for(const [width,height] of [[1280,720],[1366,768],[1440,900],[1920,1080],[640,360]]) {await p.setViewportSize({width,height});await p.waitForTimeout(500);assert(await exit.isVisible());const box=await exit.boundingBox();assert(box.x+box.width<=width);await p.screenshot({path:`${out}/client-view-active-${width}.png`});}
  await p.setViewportSize({width:1440,height:900});
  const saved=await p.evaluate(()=>{const s=sessionStorage.getItem('pl_original_admin_user');sessionStorage.setItem('pl_original_admin_user','{invalid');return s;});
  await exit.click();await p.getByRole('alert').filter({hasText:'Could not restore your session'}).waitFor();assert.equal((await identity(p)).role,'LEGAL_COUNSEL');assert.equal(await p.evaluate(()=>sessionStorage.getItem('pl_client_mode')),'true');
  await p.screenshot({path:`${out}/client-view-exit-error-1440.png`});await p.setViewportSize({width:640,height:360});await p.screenshot({path:`${out}/client-view-exit-error-640.png`});
  await p.evaluate(s=>sessionStorage.setItem('pl_original_admin_user',s),saved);
 }
 await exit.click();await p.waitForTimeout(2000);console.log('EXIT STATE',p.url(),await p.getByRole('alert').allTextContents(),await identity(p));await p.waitForURL('**/clients');await p.getByRole('heading',{name:'Clients',exact:true}).waitFor();const restored=await identity(p);assert.equal(restored.id,original.id);assert.equal(restored.role,role);assert.deepEqual(restored.assigned_client_ids,original.assigned_client_ids);assert.equal(restored.clientId,null);assert.equal(restored.client,null);assert.equal(await p.evaluate(()=>sessionStorage.getItem('pl_client_mode')),null);console.log('PASS entry, persistent indicator, exit restored exact identity/scope:',role);
 await c.close();
}} finally {await b.close();}
