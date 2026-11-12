# URL Shortener

Next.js(App Router) + Upstash Redis + Vercel

- POST /api/shorten: URL 단축 (201 신규 / 200 중복), 6자리 shortCode
- 동일 URL 재요청 시 기존 shortCode 반환
- 자기 서비스 호스트 URL 단축 차단 (400)
- GET /{shortCode}: 307 리다이렉트 + Cache-Control: no-store
- /admin, /api/stats: Basic 인증 (미인증 401)
