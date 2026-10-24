import { z } from "zod";

export const content = z.discriminatedUnion("kind", [
  z.object({ kind: z.literal("asset"), id: z.string().min(1), title: z.string().min(1), description: z.string().min(1), moderation: z.enum(["approved", "pending", "rejected"]) }),
  z.object({ kind: z.literal("event"), id: z.string().min(1), title: z.string().min(1), description: z.string().min(1), moderation: z.enum(["approved", "pending", "rejected"]) }),
  z.object({ kind: z.literal("queue"), id: z.string().min(1), title: z.string().min(1), description: z.string().min(1), moderation: z.enum(["approved", "pending", "rejected"]) })
]);

export const searchInput = z.object({ query: z.string().min(1), top_k: z.number().int().min(1).max(20).default(5) });

export type Content = z.infer<typeof content>;

export function searchable(item: Content): boolean {
  return item.kind !== "queue" && item.moderation === "approved";
}

export function searchText(item: Content): string {
  return `${item.kind}: ${item.title}. ${item.description}`;
}
