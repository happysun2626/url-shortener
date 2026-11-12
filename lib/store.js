import { Redis } from "@upstash/redis";

const url = process.env.UPSTASH_REDIS_REST_URL || process.env.KV_REST_API_URL;
const token = process.env.UPSTASH_REDIS_REST_TOKEN || process.env.KV_REST_API_TOKEN;

// 자동 역직렬화를 끄지 않으면 "012345" 같은 코드가 숫자로 변환됨
const redis = url && token ? new Redis({ url, token, automaticDeserialization: false }) : null;

// automaticDeserialization을 끄면 hgetall이 [key, value, ...] 배열로 올 수 있어 객체로 통일
function toObj(h) {
  if (!h) return null;
  if (Array.isArray(h)) {
    const o = {};
    for (let i = 0; i + 1 < h.length; i += 2) o[h[i]] = h[i + 1];
    return Object.keys(o).length ? o : null;
  }
  return Object.keys(h).length ? h : null;
}

// 로컬 개발 전용 메모리 저장소 (production에서는 사용 불가)
const mem = (globalThis.__urlMem ??= { map: new Map(), links: new Map(), list: [] });

function ensureStore() {
  if (!redis && process.env.NODE_ENV === "production") {
    throw new Error("STORE_NOT_CONFIGURED: Upstash Redis 환경변수가 없습니다.");
  }
}

const ALPHABET = "ABCDEFGHIJKLMNOPQRSTUVWXYZabcdefghijklmnopqrstuvwxyz0123456789";

export function generateCode() {
  const bytes = new Uint8Array(6);
  crypto.getRandomValues(bytes);
  return Array.from(bytes, (b) => ALPHABET[b % ALPHABET.length]).join("");
}

export async function getCodeByUrl(normalizedUrl) {
  ensureStore();
  if (!redis) return mem.map.get(normalizedUrl) ?? null;
  return (await redis.get(`map:${normalizedUrl}`)) ?? null;
}

export async function getLink(code) {
  ensureStore();
  if (!redis) return mem.links.get(code) ?? null;
  const h = toObj(await redis.hgetall(`link:${code}`));
  if (!h || !h.originalUrl) return null;
  return { code, originalUrl: h.originalUrl, clicks: Number(h.clicks || 0), createdAt: h.createdAt };
}

// 같은 URL이 동시에 들어와도 하나의 코드만 남도록 NX 사용
export async function createLink(normalizedUrl, originalUrl) {
  ensureStore();
  const createdAt = new Date().toISOString();

  for (let i = 0; i < 5; i++) {
    const code = generateCode();

    if (!redis) {
      if (mem.links.has(code)) continue;
      const existing = mem.map.get(normalizedUrl);
      if (existing) return { code: existing, created: false };
      mem.map.set(normalizedUrl, code);
      mem.links.set(code, { code, originalUrl, clicks: 0, createdAt });
      mem.list.unshift(code);
      return { code, created: true };
    }

    if (await redis.exists(`link:${code}`)) continue;
    await redis.hset(`link:${code}`, { originalUrl, clicks: "0", createdAt });
    const ok = await redis.set(`map:${normalizedUrl}`, code, { nx: true });
    if (ok) {
      await redis.lpush("codes", code);
      return { code, created: true };
    }
    await redis.del(`link:${code}`);
    const existing = await redis.get(`map:${normalizedUrl}`);
    return { code: existing, created: false };
  }
  throw new Error("CODE_GENERATION_FAILED");
}

export async function incrementClick(code) {
  ensureStore();
  if (!redis) {
    const l = mem.links.get(code);
    if (l) l.clicks += 1;
    return;
  }
  await redis.hincrby(`link:${code}`, "clicks", 1);
}

export async function listLinks(limit = 100) {
  ensureStore();
  if (!redis) return mem.list.slice(0, limit).map((c) => mem.links.get(c));
  const codes = await redis.lrange("codes", 0, limit - 1);
  if (!codes.length) return [];
  const pipe = redis.pipeline();
  codes.forEach((c) => pipe.hgetall(`link:${c}`));
  const rows = await pipe.exec();
  const objs = rows.map(toObj);
  return objs
    .map((h, i) => (h && h.originalUrl ? { code: codes[i], originalUrl: h.originalUrl, clicks: Number(h.clicks || 0), createdAt: h.createdAt } : null))
    .filter(Boolean);
}
