import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url),ts=require('typescript');
function load(file,overrides={}){
 const source=ts.transpileModule(readFileSync(new URL('../'+file,import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const m={exports:{}};new Function('require','module','exports',source)(n=>n in overrides?overrides[n]:require(n),m,m.exports);return m.exports;
}
const files=load('lib/memories/files.ts');
const monthly=load('lib/memories/monthly.ts',{'./files':files});
test('calendar uses Amsterdam across midnight and daylight saving time',()=>{
 assert.deepEqual(monthly.monthPeriod(new Date('2026-10-31T23:30:00Z')),{year:2026,month:11,day:1,period:'2026-11'});
 assert.equal(monthly.monthPeriod(new Date('2026-06-30T22:30:00Z')).month,7);
});
test('cron requires a long matching secret and cannot be authenticated by a browser session',()=>{
 assert.equal(monthly.validCronAuthorization(null,'x'.repeat(32)),false);
 assert.equal(monthly.validCronAuthorization('Bearer short','short'),false);
 assert.equal(monthly.validCronAuthorization('Bearer '+'x'.repeat(32),'y'.repeat(32)),false);
 assert.equal(monthly.validCronAuthorization('Bearer '+'x'.repeat(32),'x'.repeat(32)),true);
});
test('mail contains at most four inline photos, escaped context and account-only archive links',()=>{
 const photos=Array.from({length:6},(_,i)=>({id:String(i),photo_year:2020,photo_month:10,photo_day:null,message:'<img src=x onerror=alert(1)> & test',image:'YWJj'}));
 const email=monthly.monthlyMail(10,photos,'https://www.basarens.com/herinneringen/afmelden?token=private');
 assert.equal(email.attachments.length,4);
 assert.equal((email.html.match(/src="cid:/g)||[]).length,4);
 assert.ok(email.html.includes('&lt;img'));
 assert.ok(!email.html.includes('onerror=alert(1)>'));
 assert.ok(!email.html.includes('/object/sign/'));
 assert.ok(email.html.includes('https://www.basarens.com/herinneringen'));
 assert.equal(email.attachments[0].content_id,'memory-0');
 assert.ok(monthly.monthlyMail(10,photos,'https://www.basarens.com/herinneringen',true).html.includes('data:image/jpeg;base64,'));
});
test('selection ordering is deterministic within a monthly period',()=>{
 const rows=Array.from({length:40},(_,i)=>({id:String(i)}));
 const order=monthly.sortMonthlyPhotos(rows,'2026-10');
 assert.deepEqual(order,monthly.sortMonthlyPhotos([...rows].reverse(),'2026-10'));
 assert.notDeepEqual(order,monthly.sortMonthlyPhotos(rows,'2027-10'));
});
test('unauthorized cron calls cannot start email delivery',async()=>{
 let calls=0;const old=process.env.CRON_SECRET;process.env.CRON_SECRET='x'.repeat(32);
 try{
  const route=load('app/api/memories/monthly/route.ts',{'@/lib/memories/monthly':monthly,'@/lib/memories/monthly-server':{sendMonthlyMemories:async()=>{calls++;return {sent:0};}}});
  assert.equal((await route.GET(new Request('https://www.basarens.com/api/memories/monthly'))).status,401);assert.equal(calls,0);
  assert.equal((await route.GET(new Request('https://www.basarens.com/api/memories/monthly',{headers:{Authorization:'Bearer '+'x'.repeat(32)}}))).status,200);assert.equal(calls,1);
 }finally{if(old===undefined)delete process.env.CRON_SECRET;else process.env.CRON_SECRET=old;}
});

function deliveryFixture(options={}) {
 const delivery={state:'pending',payload:{to:['private@example.com'],html:'frozen mail'},photo_ids:['photo'],claimed_at:null};
 let fetches=0;
 const client={from(table){
  let columns='',update=null;
  const result=()=>{
   if(table==='memories_mail_preferences')return {data:columns==='user_id,unsubscribe_token,memories_members(email,active)'?[{user_id:'user',unsubscribe_token:'token',memories_members:{email:'private@example.com',active:true}}]:{enabled:!options.unsubscribed,memories_members:{active:!options.revoked}},error:null};
   if(table==='memories_uploads')return {data:options.removed?[]:[{id:'photo',memories_removal_votes:options.disputed?[{user_id:'friend'}]:[]}],error:null};
   if(update&&update.state!=='uncertain')Object.assign(delivery,update);
   else if(update?.state==='uncertain'&&!options.cleanup)Object.assign(delivery,update);
   return {data:delivery,error:null};
  };
  const q={select(s){columns=s;return q;},eq(){return q;},is(){return q;},in(){return q;},lt(){options.cleanup=true;return q;},update(v){update=v;return q;},maybeSingle:async()=>result(),single:async()=>result(),then(resolve,reject){return Promise.resolve(result()).then(resolve,reject);}};return q;
 },rpc:async()=>{if(!['pending','failed'].includes(delivery.state))return {data:false,error:null};delivery.state='sending';options.cleanup=false;return {data:true,error:null};}};
 const server=load('lib/memories/monthly-server.ts',{'server-only':{},sharp:()=>{throw Error('Unexpected image rebuild');},'./server':{memoriesClient:()=>client,MEMORIES_BUCKET:'private'},'./monthly':{...monthly,monthPeriod:()=>({year:2026,month:10,day:1,period:'2026-10'})}});
 return {delivery,server,fetches:()=>fetches,fetch:async()=>{fetches++;if(options.networkFailure)throw Error('Unknown provider acceptance');return Response.json({id:'provider-id'});}};
}
test('frozen deliveries send once and remove attachment payload after acceptance',async()=>{
 const original=global.fetch,key=process.env.MEMORIES_RESEND_API_KEY;process.env.MEMORIES_RESEND_API_KEY='test';
 const f=deliveryFixture();global.fetch=f.fetch;
 try{await f.server.sendMonthlyMemories();assert.equal(f.delivery.state,'sent');assert.equal(f.delivery.payload,null);await f.server.sendMonthlyMemories();assert.equal(f.fetches(),1);}
 finally{global.fetch=original;if(key===undefined)delete process.env.MEMORIES_RESEND_API_KEY;else process.env.MEMORIES_RESEND_API_KEY=key;}
});
test('unsubscribe, membership revocation, removed or disputed photos prevent delivery',async()=>{
 const original=global.fetch,key=process.env.MEMORIES_RESEND_API_KEY;process.env.MEMORIES_RESEND_API_KEY='test';
 try{for(const options of [{unsubscribed:true},{revoked:true},{removed:true},{disputed:true}]){const f=deliveryFixture(options);global.fetch=f.fetch;await f.server.sendMonthlyMemories();assert.equal(f.fetches(),0);assert.equal(f.delivery.state,'skipped');}}
 finally{global.fetch=original;if(key===undefined)delete process.env.MEMORIES_RESEND_API_KEY;else process.env.MEMORIES_RESEND_API_KEY=key;}
});
test('unknown provider acceptance is marked uncertain and never blindly retried',async()=>{
 const original=global.fetch,key=process.env.MEMORIES_RESEND_API_KEY;process.env.MEMORIES_RESEND_API_KEY='test';
 const f=deliveryFixture({networkFailure:true});global.fetch=f.fetch;
 try{await f.server.sendMonthlyMemories();assert.equal(f.delivery.state,'uncertain');await f.server.sendMonthlyMemories();assert.equal(f.fetches(),1);}
 finally{global.fetch=original;if(key===undefined)delete process.env.MEMORIES_RESEND_API_KEY;else process.env.MEMORIES_RESEND_API_KEY=key;}
});
