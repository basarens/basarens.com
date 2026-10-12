// Explicit integration check against the configured Supabase project.
// Creates one tiny test photo, verifies privacy/receipt, then removes only that photo.
import assert from "node:assert/strict";
import { createHash } from "node:crypto";
import { createClient } from "@supabase/supabase-js";

process.loadEnvFile(".env.local");
const origin = process.argv.includes("--live") ? "https://www.basarens.com" : "http://127.0.0.1:3001";
const token = process.env.MEMORIES_UPLOAD_TOKEN;
assert.ok(token && process.env.MEMORIES_SUPABASE_SECRET_KEY && process.env.NEXT_PUBLIC_SUPABASE_URL, "Missing local configuration");
const client = createClient(process.env.NEXT_PUBLIC_SUPABASE_URL, process.env.MEMORIES_SUPABASE_SECRET_KEY, {
  auth: { persistSession: false, autoRefreshToken: false },
});
const bytes = Buffer.from("iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAQAAAC1HAwCAAAAC0lEQVR42mP8/x8AAwMCAO+jWZkAAAAASUVORK5CYII=", "base64");
const linkHash = createHash("sha256").update(token).digest("hex");
let id;
let path;

async function api(body, bearer = token) {
  return fetch(`${origin}/api/memories`, {
    method: "POST", headers: { "Content-Type": "application/json", Authorization: `Bearer ${bearer}` },
    body: JSON.stringify(body), signal: AbortSignal.timeout(30000),
  });
}

async function edit(body, bearer = token) {
  return fetch(`${origin}/api/memories`, {
    method: "PATCH", headers: { "Content-Type": "application/json", Authorization: `Bearer ${bearer}` },
    body: JSON.stringify(body), signal: AbortSignal.timeout(30000),
  });
}

try {
  const page = await fetch(`${origin}/herinneringen/${token}`);
  assert.equal(page.status, 200, "Invitation should load");
  assert.ok(!(await page.text()).includes(process.env.MEMORIES_SUPABASE_SECRET_KEY), "Server key must not appear in HTML");
  assert.equal((await api({ action: "prepare" }, "invalid")).status, 403);
  const prepare = await api({ action: "prepare", filename: "integration-check.png", type: "image/png", size: bytes.length, name: "Integration check", message: "Temporary test, automatically removed." });
  assert.equal(prepare.status, 200, "Upload reservation should succeed");
  const reservation = await prepare.json();
  id = reservation.id;
  assert.match(id, /^[0-9a-f-]{36}$/);
  path = `${linkHash.slice(0, 16)}/${id}.png`;
  const changes = { id, name: "Test photographer", message: "Test context", previousName: "Integration check", previousMessage: "Temporary test, automatically removed." };
  assert.equal((await edit(changes, "invalid")).status, 403, "Editing must require a valid invitation");
  assert.equal((await edit(changes)).status, 404, "Pending uploads must not be editable");
  assert.equal((await api({ action: "complete", id })).status, 409, "An absent photo must not be confirmed");
  const upload = await fetch(reservation.uploadUrl, { method: "PUT", headers: { "Content-Type": "image/png" }, body: bytes });
  assert.ok(upload.ok, `Direct upload failed (${upload.status})`);
  const complete = await api({ action: "complete", id });
  assert.equal(complete.status, 200, "Receipt should succeed");
  const row = await client.from("memories_uploads").select("status,path,name,message,size").eq("id", id).single();
  assert.equal(row.error, null);
  assert.equal(row.data.status, "complete");
  assert.equal(row.data.path, path);
  assert.equal(row.data.size, bytes.length);
  assert.equal(row.data.name, "Integration check");
  const update = await edit(changes);
  assert.equal(update.status, 200, "Context and photographer edit should succeed");
  assert.equal((await update.json()).photo.name, "Test photographer");
  assert.equal((await edit({ ...changes, message: "Stale edit" })).status, 409, "Concurrent edits must not silently overwrite context");
  const archiveResponse = await fetch(`${origin}/api/memories`, { headers: { Authorization: `Bearer ${token}` } });
  assert.equal(archiveResponse.status, 200);
  const archived = (await archiveResponse.json()).photos.find(photo => photo.id === id);
  assert.ok(archived, "Test photo must be visible in archive");
  assert.equal(archived.name, "Test photographer");
  assert.equal(archived.message, "Test context");
  const download = await client.storage.from("memories-inbox").download(path);
  assert.equal(download.error, null);
  assert.deepEqual(Buffer.from(await download.data.arrayBuffer()), bytes, "Original photo bytes must be preserved");
  const publicUrl = client.storage.from("memories-inbox").getPublicUrl(path).data.publicUrl;
  assert.ok(!(await fetch(publicUrl)).ok, "Photo must not be publicly accessible");
  console.log("PASS: invitation, upload, shared archive, photographer/context edits, concurrent edit rejection, original file and private storage.");
} catch (error) {
  // Do not log raw network responses or credentials.
  console.error(`FAIL: ${error instanceof assert.AssertionError ? error.message : "Integration check could not complete"}`);
  process.exitCode = 1;
} finally {
  if (id && path) {
    const removal = await client.storage.from("memories-inbox").remove([path]);
    if (removal.error) {
      console.error("Temporary test photo cleanup failed.");
      process.exitCode = 1;
    } else {
      const deletion = await client.from("memories_uploads").delete().eq("id", id).eq("link_hash", linkHash).eq("filename", "integration-check.png");
      if (deletion.error) { console.error("Temporary test record cleanup failed."); process.exitCode = 1; }
      else console.log("Temporary test photo and record removed.");
    }
  }
}
