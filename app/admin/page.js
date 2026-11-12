import { listLinks } from "@/lib/store";

export const dynamic = "force-dynamic";
export const metadata = { title: "Admin - URL Shortener" };

export default async function Admin() {
  const links = await listLinks(100);
  const total = links.reduce((s, l) => s + l.clicks, 0);
  const cell = { padding: "8px 10px", borderBottom: "1px solid #eee", textAlign: "left", fontSize: 14 };

  return (
    <main style={{ maxWidth: 960, margin: "40px auto", padding: 24, background: "#fff", borderRadius: 12 }}>
      <h1 style={{ marginTop: 0 }}>관리자</h1>
      <p>전체 링크: {links.length}개 / 전체 클릭: {total}회</p>
      <table style={{ width: "100%", borderCollapse: "collapse" }}>
        <thead>
          <tr><th style={cell}>shortCode</th><th style={cell}>원본 URL</th><th style={cell}>클릭</th><th style={cell}>생성일</th></tr>
        </thead>
        <tbody>
          {links.map((l) => (
            <tr key={l.code}>
              <td style={cell}>{l.code}</td>
              <td style={{ ...cell, wordBreak: "break-all" }}>{l.originalUrl}</td>
              <td style={cell}>{l.clicks}</td>
              <td style={cell}>{l.createdAt}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </main>
  );
}
