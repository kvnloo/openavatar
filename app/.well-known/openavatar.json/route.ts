import { STUDIO_TOOLS } from "@/lib/studio";

export function GET() {
  return Response.json({
    name: "Open Avatar",
    version: "0.1.0",
    spec: "open-identity-card",
    card: {
      handle: "unique public identifier",
      kind: ["person", "agent"],
      displayName: "string",
      bio: "string",
      controller: "optional handle for agent cards",
      links: [{ label: "string", url: "https://" }],
      likeness: { tool: "studio tool id", note: "optional" },
      voice: { tool: "studio tool id", note: "optional" },
    },
    endpoints: {
      directory: "/api/cards",
      card: "/api/cards/{handle}",
      html: "/c/{handle}",
    },
    studio: STUDIO_TOOLS.map((tool) => tool.id),
  });
}
