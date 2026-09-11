import { getPublicCard } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ handle: string }> },
) {
  const { handle } = await params;
  const card = await getPublicCard(handle);
  if (!card) {
    return Response.json({ error: "not_found" }, { status: 404 });
  }
  return Response.json({ card });
}
