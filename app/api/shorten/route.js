import { createLink, getCodeByUrl } from "@/lib/store";
import { getOrigin, isSelfUrl } from "@/lib/selfhost";

export const dynamic = "force-dynamic";

const json = (body, status) =>
  Response.json(body, { status, headers: { "Cache-Control": "no-store" } });

export async function POST(req) {
  let body = null;
  try {
    body = await req.json();
  } catch {}

  const value = body?.originalUrl;
  const trimmed = typeof value === "string" ? value.trim() : value;

  // 1) 누락 / 빈 문자열
  if (trimmed === undefined || trimmed === null || trimmed === "") {
    return json({ error: "MISSING_URL", message: "originalUrl이 필요합니다." }, 400);
  }

  // 2) 형식 검사 (http/https만 허용)
  let parsed;
  try {
    if (typeof trimmed !== "string") throw new Error("not string");
    parsed = new URL(trimmed);
    if (!["http:", "https:"].includes(parsed.protocol)) throw new Error("protocol");
  } catch {
    return json({ error: "INVALID_URL", message: "올바른 http/https URL이 아닙니다." }, 400);
  }

  // 3) 자기 서비스 URL 차단 (경로·프로토콜 무관, 호스트 기준)
  if (isSelfUrl(req, parsed)) {
    return json({ error: "SELF_URL_NOT_ALLOWED", message: "이 서비스의 URL은 단축할 수 없습니다." }, 400);
  }

  try {
    const origin = getOrigin(req);
    const normalized = parsed.href;
    const build = (code, status) =>
      json({ shortCode: code, shortUrl: `${origin}/${code}`, originalUrl: trimmed }, status);

    // 4) 중복 URL → 기존 shortCode 반환
    const existing = await getCodeByUrl(normalized);
    if (existing) return build(existing, 200);

    // 5) 신규 생성 (동시 요청 시에도 같은 코드 보장)
    const { code, created } = await createLink(normalized, trimmed);
    return build(code, created ? 201 : 200);
  } catch (e) {
    console.error(e);
    return json({ error: "INTERNAL_ERROR", message: "서버 오류가 발생했습니다." }, 500);
  }
}
