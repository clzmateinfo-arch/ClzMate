import { describe, it } from "node:test";
import assert from "node:assert/strict";
import { isChunkLoadError, recoverFromStaleDeploy, stripCacheBuster, withCacheBuster } from "../src/shared/utils/staleDeploy.js";

const makeStorage = (initial = {}) => {
  const data = { ...initial };
  return {
    getItem: (key) => (key in data ? data[key] : null),
    setItem: (key, value) => {
      data[key] = String(value);
    },
    data,
  };
};

describe("isChunkLoadError", () => {
  it("recognises the exact error from production and the other browsers' wording", () => {
    const messages = [
      "Failed to fetch dynamically imported module: https://clzmate.onrender.com/assets/Home-CUZTYOkP.js",
      "error loading dynamically imported module: https://x/assets/a.js",
      "Importing a module script failed.",
      "Loading chunk 12 failed.",
      "Loading CSS chunk abc-def failed",
      "Unable to preload CSS for /assets/index-1.css",
    ];
    for (const message of messages) {
      assert.equal(isChunkLoadError(new TypeError(message)), true, message);
      assert.equal(isChunkLoadError(message), true, `string: ${message}`);
    }
  });

  it("ignores ordinary errors and tolerates odd input", () => {
    for (const value of [new Error("Cannot read properties of undefined"), new Error("Network Error"), "", null, undefined, {}, { message: 5 }, 42]) {
      assert.equal(isChunkLoadError(value), false);
    }
  });
});

describe("cache buster", () => {
  it("adds a unique parameter, keeps path, query and hash, and round-trips", () => {
    const url = "https://clzmate.onrender.com/catalog/abc?price=free#top";
    const busted = withCacheBuster(url, 1700000000000);
    const parsed = new URL(busted);
    assert.equal(parsed.pathname, "/catalog/abc");
    assert.equal(parsed.searchParams.get("price"), "free");
    assert.equal(parsed.searchParams.get("_r"), "1700000000000");
    assert.equal(parsed.hash, "#top");
    assert.equal(stripCacheBuster(busted), "/catalog/abc?price=free#top");
  });

  it("replaces an existing parameter instead of stacking them and ignores clean URLs", () => {
    const once = withCacheBuster("https://x.test/a", 1);
    const twice = withCacheBuster(once, 2);
    assert.equal([...new URL(twice).searchParams.keys()].filter((key) => key === "_r").length, 1);
    assert.equal(new URL(twice).searchParams.get("_r"), "2");
    assert.equal(stripCacheBuster("https://x.test/a?b=1"), null);
    assert.equal(stripCacheBuster("https://x.test/a"), null);
  });
});

describe("recoverFromStaleDeploy", () => {
  const base = { currentUrl: "https://clzmate.onrender.com/", now: 1_000_000 };

  it("reloads once to a cache-busted URL and records the time", () => {
    const storage = makeStorage();
    const visited = [];
    const didReload = recoverFromStaleDeploy({ ...base, storage, navigate: (url) => visited.push(url) });
    assert.equal(didReload, true);
    assert.deepEqual(visited, ["https://clzmate.onrender.com/?_r=1000000"]);
    assert.equal(storage.data["clz:stale-deploy-reload"], "1000000");
  });

  it("does not reload again within the guard window, so a persistent failure cannot loop", () => {
    const storage = makeStorage({ "clz:stale-deploy-reload": String(base.now - 30_000) });
    const visited = [];
    assert.equal(recoverFromStaleDeploy({ ...base, storage, navigate: (url) => visited.push(url) }), false);
    assert.deepEqual(visited, []);
  });

  it("allows a new recovery once the guard window has passed", () => {
    const storage = makeStorage({ "clz:stale-deploy-reload": String(base.now - 61_000) });
    const visited = [];
    assert.equal(recoverFromStaleDeploy({ ...base, storage, navigate: (url) => visited.push(url) }), true);
    assert.equal(visited.length, 1);
  });

  it("refuses to reload when storage cannot record the guard (private mode), to avoid loops", () => {
    const blocked = {
      getItem: () => {
        throw new Error("blocked");
      },
      setItem: () => {
        throw new Error("blocked");
      },
    };
    const visited = [];
    assert.equal(recoverFromStaleDeploy({ ...base, storage: blocked, navigate: (url) => visited.push(url) }), false);
    assert.equal(recoverFromStaleDeploy({ ...base, storage: null, navigate: (url) => visited.push(url) }), false);
    assert.deepEqual(visited, []);
  });

  it("does nothing without a current URL (non-browser context)", () => {
    assert.equal(recoverFromStaleDeploy({ storage: makeStorage(), currentUrl: "", navigate: () => assert.fail("must not navigate") }), false);
  });

  it("treats a corrupt guard value as no guard", () => {
    const storage = makeStorage({ "clz:stale-deploy-reload": "not-a-number" });
    assert.equal(recoverFromStaleDeploy({ ...base, storage, navigate: () => {} }), true);
  });
});
