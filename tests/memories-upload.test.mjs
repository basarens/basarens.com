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
  const query = {
    select() { return this; }, eq(...args) { calls.push(["eq", ...args]); return this; },
    maybeSingle: async () => ({ data: { path: "private/photo.jpg", size: 120, status: "pending" }, error: null }),
    insert: async (row) => { calls.push(["insert", row]); return { error: null }; },
    update() { calls.push(["update"]); return this; },
    delete() { return this; },
  };
  const storage = {
    getBucket: async () => ({ data: { public: options.public ?? false, file_size_limit: files.MAX_PHOTO_BYTES, allowed_mime_types: ["image/jpeg"] }, error: null }),
    from() { return this; },
    createSignedUploadUrl: async (path) => { calls.push(["sign", path]); return { data: { signedUrl: "https://storage.example/upload" }, error: null }; },
    info: async () => ({ data: { size: options.size ?? 120 }, error: null }),
    remove: async (paths) => { calls.push(["remove", paths]); return { error: null }; },
  };
  const server = {
    MEMORIES_BUCKET: "memories-inbox", validMemoriesToken: (token) => token === "valid",
    memoriesConfigured: () => options.configured ?? true,
    memoriesLinkHash: () => "a".repeat(64), memoriesClient: () => ({ storage, from: () => query }),
  };
  const { POST } = load("app/api/memories/route.ts", { "@/lib/memories/files": files, "@/lib/memories/server": server });
  return { calls, run: (body, token = "valid") => POST(new Request("https://example.com/api/memories", {
    method: "POST", headers: { authorization: `Bearer ${token}` }, body: JSON.stringify(body),
  })) };
}
const prepare = { action: "prepare", filename: "../../photo.jpg", type: "image/jpeg", size: 120, name: "Friend", message: "A memory" };

test("invalid invitations and unconfigured storage cannot reserve uploads", async () => {
  const f = fixture();
  assert.equal((await f.run(prepare, "invalid")).status, 403);
  assert.equal(f.calls.length, 0);
  assert.equal((await fixture({ configured: false }).run(prepare)).status, 503);
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
