import { NextResponse } from "next/server";

export function middleware(req) {
  const user = process.env.ADMIN_USER || "admin";
  const pass = process.env.ADMIN_PASSWORD;
  const auth = req.headers.get("authorization") || "";

  if (pass && auth.startsWith("Basic ")) {
    try {
      const decoded = atob(auth.slice(6).trim());
      const idx = decoded.indexOf(":");
      if (idx >= 0 && decoded.slice(0, idx) === user && decoded.slice(idx + 1) === pass) {
        return NextResponse.next();
      }
    } catch {}
  }

  return new NextResponse(JSON.stringify({ error: "UNAUTHORIZED", message: "인증이 필요합니다." }), {
    status: 401,
    headers: {
      "WWW-Authenticate": 'Basic realm="Admin", charset="UTF-8"',
      "Content-Type": "application/json; charset=utf-8",
      "Cache-Control": "no-store",
    },
  });
}

export const config = { matcher: ["/admin/:path*", "/api/stats"] };
