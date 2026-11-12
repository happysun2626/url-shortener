import { getLink, incrementClick } from "@/lib/store";

export const dynamic = "force-dynamic";

const notFound = () =>
  Response.json(
    { error: "NOT_FOUND", message: "존재하지 않는 shortCode입니다." },
    { status: 404, headers: { "Cache-Control": "no-store" } }
  );

export async function GET(_req, { params }) {
  const { code } = await params;
  if (!/^[A-Za-z0-9]{6}$/.test(code)) return notFound();

  const link = await getLink(code);
  if (!link) return notFound();

  try {
    await incrementClick(code);
  } catch (e) {
    console.error(e);
  }

  let location = link.originalUrl;
  // 헤더에는 ASCII만 허용되므로 비ASCII URL은 인코딩된 형태 사용
  if (/[^\x20-\x7e]/.test(location)) location = new URL(location).href;

  return new Response(null, {
    status: 307,
    headers: { Location: location, "Cache-Control": "no-store" },
  });
}
