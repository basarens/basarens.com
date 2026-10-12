import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('typescript');
function handler(account, sameOrigin=true) {
  const source=ts.transpileModule(readFileSync(new URL('../app/api/memories/removal/route.ts',import.meta.url),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
  const loaded={exports:{}};const calls=[];
  new Function('require','module','exports',source)(name=>name.endsWith('/auth')?{memoriesSameOrigin:()=>sameOrigin,memoriesAccountAccess:async()=>account}:{memoriesClient:()=>({rpc:async(name,args)=>{calls.push({name,args});return {data:{votes:1,voted:true,deleted:false},error:null};}})},loaded,loaded.exports);
  return {calls,run:body=>loaded.exports.POST(new Request('https://www.basarens.com/api/memories/removal',{method:'POST',body:JSON.stringify(body)}))};
}
const body={id:'12345678-1234-1234-1234-123456789abc',action:'vote',voter:'spoofed-user'};
test('removal denies anonymous, cross-site, malformed and friend restore requests',async()=>{
  assert.equal((await handler(null).run(body)).status,401);
  assert.equal((await handler({userId:'friend',role:'friend'},false).run(body)).status,403);
  const f=handler({userId:'friend',role:'friend'});
  assert.equal((await f.run({...body,action:'restore'})).status,403);
  assert.equal((await f.run({...body,id:'invalid'})).status,400);
  assert.equal((await f.run({...body,action:'destroy'})).status,400);
  assert.equal(f.calls.length,0);
});
test('voting uses the verified account identity; owner restoration uses the same atomic transaction',async()=>{
  const f=handler({userId:'real-user',role:'friend'});
  assert.equal((await f.run(body)).status,200);
  assert.equal(f.calls[0].args.voter,'real-user');
  const owner=handler({userId:'owner',role:'owner'});
  assert.equal((await owner.run({...body,action:'restore'})).status,200);
  assert.equal(owner.calls[0].args.operation,'restore');
});
