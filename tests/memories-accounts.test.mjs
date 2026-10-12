import {test} from 'node:test';
import assert from 'node:assert/strict';
import {readFileSync} from 'node:fs';
import {createRequire} from 'node:module';
const require=createRequire(import.meta.url);
const ts=require('typescript');
function fixture({user={id:'approved-user'},authError=null,member={user_id:'approved-user',display_name:'Friend',role:'friend'},memberError=null,configured=true}={}){
 const checks=[];
 const code=ts.transpileModule(readFileSync('lib/memories/auth.ts','utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2022}}).outputText;
 const query={select(){return this;},eq(...args){checks.push(args);return this;},async maybeSingle(){return {data:member,error:memberError};}};
 const overrides={'server-only':{},'@supabase/ssr':{createServerClient(){return {auth:{async getUser(){return {data:{user},error:authError};}}};}},'next/headers':{async cookies(){return {getAll(){return [{name:'fake-session',value:'untrusted'}];},set(){}};}},'./server':{memoriesConfigured:()=>configured,memoriesClient:()=>({from:()=>query})}};
 const m={exports:{}};
 new Function('require','module','exports',code)(name=>overrides[name]??require(name),m,m.exports);
 return {access:m.exports.memoriesAccountAccess,sameOrigin:m.exports.memoriesSameOrigin,checks};
}
test('account access requires a verified user and active approved membership',async()=>{
 for(const options of [{configured:false},{user:null},{authError:{message:'invalid'}},{member:null},{memberError:{message:'failure'}}])assert.equal(await fixture(options).access(),null);
 const f=fixture();assert.equal((await f.access()).userId,'approved-user');assert.deepEqual(f.checks,[['user_id','approved-user'],['active',true]]);
});
test('membership revocation is rechecked for every request',async()=>{
 const f=fixture();await f.access();await f.access();assert.equal(f.checks.filter(([field])=>field==='active').length,2);
});
test('cookie mutations require the exact same origin',()=>{
 const f=fixture();assert.equal(f.sameOrigin(new Request('https://www.basarens.com/api/memories',{headers:{origin:'https://www.basarens.com'}})),true);
 for(const origin of ['https://attacker.example','https://evil.basarens.com'])assert.equal(f.sameOrigin(new Request('https://www.basarens.com/api/memories',{headers:{origin}})),false);
 assert.equal(f.sameOrigin(new Request('https://www.basarens.com/api/memories')),false);
});
