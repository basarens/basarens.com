// Checks the real transaction using a disposable metadata row, never a friend's photo.
import assert from 'node:assert/strict';
import {randomUUID,createHash} from 'node:crypto';
import {createClient} from '@supabase/supabase-js';
process.loadEnvFile('.env.local');
const client=createClient(process.env.NEXT_PUBLIC_SUPABASE_URL,process.env.MEMORIES_SUPABASE_SECRET_KEY,{auth:{persistSession:false,autoRefreshToken:false}});
const members=await client.from('memories_members').select('user_id,role').eq('active',true);
assert.equal(members.error,null);
const owner=members.data.find(m=>m.role==='owner');
const friend=members.data.find(m=>m.role==='friend');
assert.ok(owner && friend);
const id=randomUUID();
const inserted=await client.from('memories_uploads').insert({id,path:`removal-test/${id}.png`,filename:'Disposable removal check',link_hash:createHash('sha256').update('removal-test').digest('hex'),size:1,name:'Test',message:'Temporary metadata only',status:'complete'});
assert.equal(inserted.error,null);
async function action(voter,operation){return client.rpc('memories_removal_action',{photo:id,voter,operation});}
try {
  assert.equal((await action(randomUUID(),'vote')).data,null);
  const first=await action(friend.user_id,'vote');assert.equal(first.error,null);assert.deepEqual(first.data,{votes:1,voted:true,deleted:false});
  assert.equal((await action(friend.user_id,'vote')).data.votes,1);
  assert.equal((await action(friend.user_id,'withdraw')).data.votes,0);
  const concurrent=await Promise.all([action(friend.user_id,'vote'),action(owner.user_id,'vote')]);
  assert.ok(concurrent.every(r=>!r.error));assert.ok(concurrent.some(r=>r.data.deleted));
  assert.ok((await client.from('memories_uploads').select('deleted_at').eq('id',id).single()).data.deleted_at);
  assert.ok((await action(friend.user_id,'restore')).error);
  assert.ok((await action(friend.user_id,'withdraw')).error);
  assert.deepEqual((await action(owner.user_id,'restore')).data,{votes:0,voted:false,deleted:false});
  assert.equal((await client.from('memories_uploads').select('deleted_at').eq('id',id).single()).data.deleted_at,null);
  console.log('PASS: one vote per account, withdrawal, two concurrent votes remove, unauthorized actions denied, owner restore clears votes.');
} finally {
  const removed=await client.from('memories_uploads').delete().eq('id',id);
  assert.equal(removed.error,null);
  console.log('Disposable metadata removed. No real photo changed.');
}
