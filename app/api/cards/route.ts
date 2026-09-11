import { listPublicCards } from "@/lib/store";

export const dynamic = "force-dynamic";

export async function GET() {
  const cards = await listPublicCards();
  return Response.json({ cards });
}
