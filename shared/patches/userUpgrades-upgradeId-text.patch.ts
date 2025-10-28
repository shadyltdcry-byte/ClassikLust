import { sql } from "drizzle-orm";
import { pgTable, text, varchar, integer, timestamp, boolean, jsonb, real, uuid } from "drizzle-orm/pg-core";
import { relations } from "drizzle-orm";
import { createInsertSchema } from "drizzle-zod";
import { z } from "zod";

// ... existing imports and tables ...

export const userUpgrades = pgTable("userUpgrades", {
  id: uuid("id").primaryKey().default(sql`gen_random_uuid()`),
  userId: uuid("userId").notNull().references(() => users.id, { onDelete: "cascade" }),
  // switched to text to support JSON string IDs like "mega-tap"
  upgradeId: text("upgradeId").notNull(),
  level: integer("level").notNull().default(0),
  purchasedAt: timestamp("purchasedAt").notNull().default(sql`now()`),
});

// ... rest of file unchanged ...
