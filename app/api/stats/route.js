import { listLinks } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const links = await listLinks(100);
  const totalClicks = links.reduce((s, l) => s + l.clicks, 0);
  return Response.json(
    { totalLinks: links.length, totalClicks, links },
    { headers: { "Cache-Control": "no-store" } }
  );
}
