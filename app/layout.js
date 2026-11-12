export const metadata = { title: "URL Shortener", description: "간단한 URL 단축 서비스" };

export default function RootLayout({ children }) {
  return (
    <html lang="ko">
      <body style={{ fontFamily: "system-ui, sans-serif", margin: 0, background: "#f6f7f9", color: "#1a1a1a" }}>
        {children}
      </body>
    </html>
  );
}
