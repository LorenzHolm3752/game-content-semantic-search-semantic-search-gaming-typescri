import assert from "node:assert/strict";
import test from "node:test";
import { content, searchable } from "./content-policy.js";

test("a pending player asset stays out of public search while an approved event appears", () => {
  const pending = content.parse({ kind: "asset", id: "sword-7", title: "Silver sword", description: "Player-created blade", moderation: "pending" });
  const event = content.parse({ kind: "event", id: "raid-9", title: "Weekend raid", description: "Co-op boss", moderation: "approved" });
  const queue = content.parse({ kind: "queue", id: "review-1", title: "Review sword", description: "Moderator assignment", moderation: "approved" });
  assert.deepEqual([pending, event, queue].filter(searchable).map((item) => item.id), ["raid-9"]);
});
