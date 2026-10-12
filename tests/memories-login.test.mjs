import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);const ts=require('typescript');
function fixture({member=true,rate=true,origin=true,codeValid=true}={}){
 const calls=[];const query={select(){return this;},eq(){return this;},async maybeSingle(){return {data:member?{user_id:'user-1'}:null,error:null};}};
 const auth={auth:{async signInWithOtp(args){calls.push(['send',args]);return {error:null};},async verifyOtp(args){calls.push(['verify',args]);return {data:{user:{id:'user-1'}},error:codeValid?null:{message:'invalid'}};},async signOut(){calls.push(['logout']);return {error:null};}}};
 const overrides={'@/lib/memories/auth':{memoriesAuthClient:async()=>auth,memoriesSameOrigin:()=>origin},'@/lib/memories/server':{memoriesConfigured:()=>true,memoriesClient:()=>({from:()=>query,rpc:async()=>({data:rate,error:null})})}};
 const source=ts.transpileModule(readFileSync('app/api/memories/login/route.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const m={exports:{}};new Function('require','module','exports',source)(name=>overrides[name]??require(name),m,m.exports);
 return {calls,run:body=>m.exports.POST(new Request('https://www.basarens.com/api/memories/login',{method:'POST',body:JSON.stringify(body)}))};
}
test('only approved friends receive codes and automatic sign-up is disabled',async()=>{
 const approved=fixture();assert.equal((await approved.run({action:'send',email:' Friend@Example.com '})).status,200);assert.deepEqual(approved.calls[0],['send',{email:'friend@example.com',options:{shouldCreateUser:false}}]);
 const blocked=fixture({member:false});assert.equal((await blocked.run({action:'send',email:'outsider@example.com'})).status,200);assert.equal(blocked.calls.length,0);
});
test('login denies cross-site calls, exhausted limits, nonmembers and invalid codes',async()=>{
 const body={action:'verify',email:'friend@example.com',code:'123456'};
 assert.equal((await fixture({origin:false}).run(body)).status,403);
 assert.equal((await fixture({rate:false}).run(body)).status,429);
 assert.equal((await fixture({member:false}).run(body)).status,403);
 assert.equal((await fixture({codeValid:false}).run(body)).status,403);
 assert.equal((await fixture().run({...body,code:'wrong'})).status,400);
 assert.equal((await fixture().run(body)).status,200);
});
