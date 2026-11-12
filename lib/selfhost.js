// 요청이 들어온 서비스 자신의 호스트 목록
export function getSelfHosts(req) {
  const hosts = new Set();
  const add = (v) => {
    if (!v) return;
    const h = v.toLowerCase().replace(/^https?:\/\//, "").split("/")[0].trim();
    if (!h) return;
    hosts.add(h);
    hosts.add(h.replace(/:\d+$/, ""));
  };
  add(req.headers.get("x-forwarded-host"));
  add(req.headers.get("host"));
  add(process.env.VERCEL_PROJECT_PRODUCTION_URL);
  add(process.env.VERCEL_URL);
  add(process.env.VERCEL_BRANCH_URL);
  return hosts;
}

export function isSelfUrl(req, parsedUrl) {
  const hosts = getSelfHosts(req);
  return hosts.has(parsedUrl.host.toLowerCase()) || hosts.has(parsedUrl.hostname.toLowerCase());
}

export function getOrigin(req) {
  const host = req.headers.get("x-forwarded-host") || req.headers.get("host");
  const proto = req.headers.get("x-forwarded-proto") || (host && host.startsWith("localhost") ? "http" : "https");
  return `${proto}://${host}`;
}
