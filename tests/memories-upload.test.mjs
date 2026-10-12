import { test } from "node:test";
import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { createRequire } from "node:module";
const require = createRequire(import.meta.url);
const ts = require("typescript");

function load(file, overrides = {}) {
  const source = ts.transpileModule(readFileSync(new URL(`../${file}`, import.meta.url), "utf8"), {
    compilerOptions: { module: ts.ModuleKind.CommonJS, target: ts.ScriptTarget.ES2022 },
  }).outputText;
  const loadedModule = { exports: {} };
  new Function("require", "module", "exports", source)(
    (name) => Object.hasOwn(overrides, name) ? overrides[name] : require(name), loadedModule, loadedModule.exports,
  );
  return loadedModule.exports;
}
const files = load("lib/memories/files.ts");

test("photo selection rejects oversized, empty and unsupported files", () => {
  assert.equal(files.validPhoto(0, "image/jpeg"), false);
  assert.equal(files.validPhoto(files.MAX_PHOTO_BYTES + 1, "image/jpeg"), false);
  assert.equal(files.validPhoto(100, "image/svg+xml"), false);
  assert.equal(files.validPhoto(files.MAX_PHOTO_BYTES, "image/heic"), true);
  assert.equal(files.photoType("holiday.HEIC", ""), "image/heic");
  assert.equal(files.photoType("fake.jpg", "text/html"), null);
});

test("invitation comparison fails closed for absent, short and incorrect secrets", () => {
  const original = process.env.MEMORIES_UPLOAD_TOKEN;
  const server = load("lib/memories/server.ts", { "server-only": {} });
  try {
    delete process.env.MEMORIES_UPLOAD_TOKEN;
    assert.equal(server.validMemoriesToken("a".repeat(64)), false);
    process.env.MEMORIES_UPLOAD_TOKEN = "short";
    assert.equal(server.validMemoriesToken("short"), false);
    process.env.MEMORIES_UPLOAD_TOKEN = "a".repeat(64);
    assert.equal(server.validMemoriesToken("a".repeat(64)), true);
    assert.equal(server.validMemoriesToken("b".repeat(64)), false);
  } finally {
    if (original === undefined) delete process.env.MEMORIES_UPLOAD_TOKEN;
    else process.env.MEMORIES_UPLOAD_TOKEN = original;
  }
});

function fixture(options = {}) {
  const calls = [];
  let updating = false;
  const query = {
    is(...args) { calls.push(["is", ...args]); return this; },
    is(...args) { calls.push(["is", ...args]); return this; },
    select() { return this; }, eq(...args) { calls.push(["eq", ...args]); return this; },
    order(...args) { calls.push(["order", ...args]); return this; },
    or(filter) { calls.push(["search", filter]); return this; },
    range: async (from, to) => { calls.push(["range", from, to]); return { data: options.paginateRows ? (options.rows ?? []).slice(from, to + 1) : options.rows ?? [], count: options.total ?? 0, error: null }; },
    maybeSingle: async () => {
      if (updating) { updating = false; return { data: options.updateMissing ? null : { id: "12345678-1234-1234-1234-123456789abc", name: "Photographer", message: "Context" }, error: options.updateError ? { code: "failure" } : null }; }
      return { data: options.photoMissing ? null : { id: "12345678-1234-1234-1234-123456789abc", path: "private/photo.jpg", size: 120, status: "pending", name: "Other editor", message: "Latest context" }, error: null };
    },
    insert: async (row) => { calls.push(["insert", row]); return { error: null }; },
    update(values) { updating = true; calls.push(["update", values]); return this; },
    delete() { return this; },
  };
  const storage = {
    getBucket: async () => ({ data: { public: options.public ?? false, file_size_limit: files.MAX_PHOTO_BYTES, allowed_mime_types: ["image/jpeg"] }, error: null }),
    from() { return this; },
    createSignedUploadUrl: async (path) => { calls.push(["sign", path]); return { data: { signedUrl: "https://storage.example/upload" }, error: null }; },
    createSignedUrls: async (paths, ttl) => { calls.push(["signed-read", paths, ttl]); return { data: paths.map((path) => ({ path, signedUrl: `https://storage.example/read/${path}` })), error: null }; },
    info: async () => ({ data: { size: options.size ?? 120 }, error: null }),
    remove: async (paths) => { calls.push(["remove", paths]); return { error: null }; },
  };
  const server = {
    MEMORIES_BUCKET: "memories-inbox", validMemoriesToken: (token) => token === "valid",
    memoriesConfigured: () => options.configured ?? true,
    memoriesLinkHash: () => "a".repeat(64), memoriesClient: () => ({ storage, from: () => query }),
  };
  const { POST, GET, PATCH } = load("app/api/memories/route.ts", { "@/lib/memories/files": files, "@/lib/memories/server": server });
  return { calls, edit: (body, token = "valid") => PATCH(new Request("https://example.com/api/memories", { method: "PATCH", headers: { authorization: `Bearer ${token}` }, body: JSON.stringify(body) })), get: (token = "valid", offset = "0", search = "", sort = "latest", seed = "") => GET(new Request(`https://example.com/api/memories?offset=${offset}&search=${encodeURIComponent(search)}&sort=${sort}&seed=${seed}`, { headers: { authorization: `Bearer ${token}` } })), run: (body, token = "valid") => POST(new Request("https://example.com/api/memories", {
    method: "POST", headers: { authorization: `Bearer ${token}` }, body: JSON.stringify(body),
  })) };
}
const prepare = { action: "prepare", filename: "../../photo.jpg", type: "image/jpeg", size: 120, name: "Friend", message: "A memory" };
const contextEdit = { id: "12345678-1234-1234-1234-123456789abc", name: "Photographer", message: "Context", previousName: "Friend", previousMessage: "A memory" };

test("partial photo dates preserve unknown parts and reject impossible calendar dates", () => {
  for (const date of [{}, {photo_year:2022}, {photo_year:2022,photo_month:5}, {photo_year:2024,photo_month:2,photo_day:29}, {photo_year:2000,photo_month:2,photo_day:29}]) assert.ok(files.readPhotoDate(date));
  for (const date of [{photo_month:5}, {photo_year:2022,photo_day:2}, {photo_year:0}, {photo_year:10000}, {photo_year:"2022"}, {photo_year:2022,photo_month:13}, {photo_year:2023,photo_month:2,photo_day:29}, {photo_year:1900,photo_month:2,photo_day:29}, {photo_year:2022,photo_month:4,photo_day:31}]) assert.equal(files.readPhotoDate(date),null);
  assert.deepEqual(files.readPhotoDate({photo_year:2022}), {photo_year:2022,photo_month:null,photo_day:null});
  assert.equal(files.formatPhotoDate(files.readPhotoDate({photo_year:2022})), "2022");
  assert.equal(files.formatPhotoDate(files.readPhotoDate({photo_year:2022,photo_month:5})), "mei 2022");
});

test("date edits compare unknown and known date parts atomically; legacy edits preserve dates", async () => {
  const f = fixture();
  const date = {photo_year:2024,photo_month:2,photo_day:29};
  const previousDate = {photo_year:2022,photo_month:null,photo_day:null};
  assert.equal((await f.edit({...contextEdit,...date,previousDate})).status,200);
  assert.deepEqual(f.calls.find(([name])=>name==="update")[1],{name:"Photographer",message:"Context",...date});
  assert.ok(f.calls.some(([name,key,value])=>name==="eq"&&key==="photo_year"&&value===2022));
  for (const field of ["photo_month","photo_day"]) assert.ok(f.calls.some(([name,key,value])=>name==="is"&&key===field&&value===null));
  assert.equal((await fixture().edit({...contextEdit,...date})).status,400);
  assert.equal((await fixture().run({...prepare,photo_year:2023,photo_month:2,photo_day:29})).status,400);
  const upload = fixture();
  assert.equal((await upload.run({...prepare,photo_year:2022})).status,200);
  assert.equal(upload.calls.find(([name])=>name==="insert")[1].photo_month,null);
});

test("search covers context and photographer before pagination and keeps completed-upload restriction", async () => {
  const f = fixture();
  assert.equal((await f.get("valid", "24", "  Gent  ")).status, 200);
  assert.deepEqual(f.calls.find(([name]) => name === "search"), ["search", 'name.ilike."%Gent%",message.ilike."%Gent%"']);
  assert.ok(f.calls.some(([name, key, value]) => name === "eq" && key === "status" && value === "complete"));
  assert.deepEqual(f.calls.find(([name]) => name === "range"), ["range", 24, 47]);
  assert.equal((await fixture().get("valid", "0", "x".repeat(101))).status, 400);
  const empty = fixture(); await empty.get("valid", "0", "   ");
  assert.ok(!empty.calls.some(([name]) => name === "search"));
});

test("editing requires invitation and validates context fields", async () => {
  assert.equal((await fixture().edit(contextEdit, "invalid")).status, 403);
  for (const body of [null, { ...contextEdit, id: "../photo" }, { ...contextEdit, name: "x".repeat(81) }, { ...contextEdit, message: "x".repeat(1201) }, { ...contextEdit, previousName: null }]) {
    const f = fixture();
    assert.equal((await f.edit(body)).status, 400);
    assert.equal(f.calls.length, 0);
  }
});

test("editing modifies only photographer/context and compares previous values atomically", async () => {
  const f = fixture();
  const response = await f.edit({ ...contextEdit, name: " Photographer ", message: " Context ", path: "forbidden.jpg", status: "pending" });
  assert.equal(response.status, 200);
  assert.deepEqual(f.calls.find(([name]) => name === "update"), ["update", { name: "Photographer", message: "Context" }]);
  for (const [field, value] of [["id", contextEdit.id], ["status", "complete"], ["name", contextEdit.previousName], ["message", contextEdit.previousMessage]]) {
    assert.ok(f.calls.some(([name, key, actual]) => name === "eq" && key === field && actual === value));
  }
  assert.deepEqual(Object.keys((await response.json()).photo).sort(), ["id", "message", "name"]);
});

test("editing detects concurrent changes and unavailable photos", async () => {
  const conflict = await fixture({ updateMissing: true }).edit(contextEdit);
  assert.equal(conflict.status, 409);
  assert.equal((await conflict.json()).current.message, "Latest context");
  assert.equal((await fixture({ updateMissing: true, photoMissing: true }).edit(contextEdit)).status, 404);
  assert.equal((await fixture({ updateError: true }).edit(contextEdit)).status, 503);
});

test("invalid invitations and unconfigured storage cannot reserve uploads", async () => {
  const f = fixture();
  assert.equal((await f.run(prepare, "invalid")).status, 403);
  assert.equal(f.calls.length, 0);
  assert.equal((await fixture({ configured: false }).run(prepare)).status, 503);
});

test("archive denies invalid invitations and public storage", async () => {
  assert.equal((await fixture().get("invalid")).status, 403);
  assert.equal((await fixture({ public: true }).get()).status, 503);
  assert.equal((await fixture().get("valid", "-1")).status, 400);
});

test("archive includes completed photos across invitations, with short-lived URLs and no internal paths", async () => {
  const f = fixture({ rows: [{ id: "photo", path: "older-invite/photo.jpg", filename: "photo.jpg", name: "Friend", message: "A story", created_at: "2026-10-12T10:00:00Z" }], total: 25 });
  const response = await f.get("valid", "24");
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  const data = await response.json();
  assert.equal(data.total, 25);
  assert.equal(data.nextOffset, null);
  assert.equal(data.photos[0].message, "A story");
  assert.ok(data.photos[0].url);
  assert.ok(!Object.hasOwn(data.photos[0], "path"));
  assert.ok(f.calls.some(([name, field, value]) => name === "eq" && field === "status" && value === "complete"));
  assert.ok(!f.calls.some(([name, field]) => name === "eq" && field === "link_hash"));
  assert.deepEqual(f.calls.find(([name]) => name === "range"), ["range", 24, 47]);
  assert.equal(f.calls.find(([name]) => name === "signed-read")[2], 3600);
});

test("archive paginates and handles an empty collection", async () => {
  const rows = Array.from({ length: 24 }, (_, index) => ({ id: String(index), path: `photo${index}.jpg` }));
  assert.equal((await (await fixture({ rows, total: 25 }).get()).json()).nextOffset, 24);
  assert.deepEqual(await (await fixture().get()).json(), { photos: [], total: 0, nextOffset: null });
});
test("public buckets and malformed metadata cannot create signed URLs", async () => {
  const f = fixture({ public: true });
  assert.equal((await f.run(prepare)).status, 503);
  assert.equal(f.calls.length, 0);
  assert.equal((await fixture().run({ ...prepare, type: "text/html" })).status, 400);
  assert.equal((await fixture().run(null)).status, 400);
});
test("uploads use random paths, keep metadata and never return server credentials", async () => {
  const f = fixture();
  const response = await f.run(prepare);
  assert.equal(response.status, 200);
  assert.equal(response.headers.get("cache-control"), "private, no-store");
  const data = await response.json();
  assert.deepEqual(Object.keys(data).sort(), ["id", "uploadUrl"]);
  const row = f.calls.find(([name]) => name === "insert")[1];
  assert.match(row.path, /^a{16}\/[0-9a-f-]{36}\.jpg$/);
  assert.equal(row.message, "A memory");
});
test("confirmation checks invitation ownership and actual size", async () => {
  const f = fixture({ size: 121 });
  const body = { action: "complete", id: "12345678-1234-1234-1234-123456789abc" };
  assert.equal((await f.run(body)).status, 400);
  assert.ok(f.calls.some(([name]) => name === "remove"));
  assert.ok(f.calls.some(([name, field]) => name === "eq" && field === "link_hash"));
  assert.ok(!f.calls.some(([name]) => name === "update"));
  assert.equal((await fixture().run(body)).status, 200);
});

test("archive date ordering puts partial and unknown dates last with stable tie breakers", async () => {
  const f = fixture();
  assert.equal((await f.get("valid","0","Gent","date")).status,200);
  assert.deepEqual(f.calls.filter(([name])=>name==="order"),[
    ["order","photo_year",{ascending:false,nullsFirst:false}],
    ["order","photo_month",{ascending:false,nullsFirst:false}],
    ["order","photo_day",{ascending:false,nullsFirst:false}],
    ["order","created_at",{ascending:false}], ["order","id",{ascending:false}],
  ]);
});

test("shuffle spans the complete archive and paginates a repeatable seeded order", async () => {
  const rows = Array.from({length:1003},(_,i)=>({id:String(i),path:`private/${i}.jpg`}));
  const f = fixture({rows,total:rows.length,paginateRows:true});
  const page = async(offset,seed)=> (await (await f.get("valid",String(offset),"Gent","shuffle",seed)).json());
  const first = await page(0,"seed-one");
  const second = await page(24,"seed-one");
  const repeat = await page(0,"seed-one");
  const fresh = await page(0,"seed-two");
  assert.equal(first.total,1003);
  assert.equal(first.photos.length,24);
  assert.equal(first.nextOffset,24);
  assert.deepEqual(first.photos.map(p=>p.id),repeat.photos.map(p=>p.id));
  assert.notDeepEqual(first.photos.map(p=>p.id),fresh.photos.map(p=>p.id));
  assert.equal(new Set([...first.photos,...second.photos].map(p=>p.id)).size,48);
  assert.ok(f.calls.some(([name,from,to])=>name==="range"&&from===1000&&to===1999));
  assert.ok(f.calls.filter(([name])=>name==="signed-read").every(call=>call[1].length===24));
  assert.equal((await fixture().get("valid","0","","shuffle","bad")).status,400);
  assert.equal((await fixture().get("valid","0","","unexpected")).status,400);
});
