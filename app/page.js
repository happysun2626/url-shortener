"use client";
import { useState } from "react";

export default function Home() {
  const [url, setUrl] = useState("");
  const [result, setResult] = useState(null);
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit() {
    setLoading(true);
    setError("");
    setResult(null);
    try {
      const res = await fetch("/api/shorten", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ originalUrl: url }),
      });
      const data = await res.json();
      if (!res.ok) setError(data.message || "요청에 실패했습니다.");
      else setResult(data);
    } catch {
      setError("네트워크 오류가 발생했습니다.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <main style={{ maxWidth: 560, margin: "80px auto", padding: 24, background: "#fff", borderRadius: 12, boxShadow: "0 2px 12px rgba(0,0,0,.08)" }}>
      <h1 style={{ marginTop: 0 }}>URL Shortener</h1>
      <div style={{ display: "flex", gap: 8 }}>
        <input
          value={url}
          onChange={(e) => setUrl(e.target.value)}
          onKeyDown={(e) => e.key === "Enter" && submit()}
          placeholder="https://example.com/very/long/url"
          style={{ flex: 1, padding: "10px 12px", border: "1px solid #ccc", borderRadius: 8, fontSize: 15 }}
        />
        <button onClick={submit} disabled={loading} style={{ padding: "10px 18px", border: 0, borderRadius: 8, background: "#2563eb", color: "#fff", fontSize: 15, cursor: "pointer" }}>
          {loading ? "처리 중..." : "단축"}
        </button>
      </div>
      {error && <p style={{ color: "#dc2626" }}>{error}</p>}
      {result && (
        <div style={{ marginTop: 20 }}>
          <div>단축 URL: <a href={result.shortUrl} target="_blank" rel="noreferrer">{result.shortUrl}</a></div>
          <div style={{ marginTop: 6, color: "#555", wordBreak: "break-all" }}>원본: {result.originalUrl}</div>
        </div>
      )}
    </main>
  );
}
