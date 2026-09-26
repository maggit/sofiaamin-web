import {
  customType,
  index,
  integer,
  jsonb,
  pgTable,
  text,
  timestamp,
  uuid,
} from "drizzle-orm/pg-core";
import type { RsvpSettings, Section } from "@/lib/sections";

const bytea = customType<{ data: Buffer; driverData: Buffer }>({
  dataType: () => "bytea",
});

export const events = pgTable("events", {
  id: uuid("id").primaryKey().defaultRandom(),
  slug: text("slug").notNull().unique(),
  title: text("title").notNull(),
  badge: text("badge").notNull().default(""),
  tagline: text("tagline").notNull().default(""),
  subtitle: text("subtitle").notNull().default(""),
  arrivalNote: text("arrival_note").notNull().default(""),
  status: text("status", { enum: ["active", "inactive"] }).notNull().default("active"),
  startsAt: timestamp("starts_at", { withTimezone: true }),
  endsAt: timestamp("ends_at", { withTimezone: true }),
  timezone: text("timezone").notNull().default("America/New_York"),
  hostedBy: text("hosted_by").notNull().default(""),
  locationName: text("location_name").notNull().default(""),
  locationAddress: text("location_address").notNull().default(""),
  capacity: integer("capacity"),
  theme: text("theme").notNull().default("blush"),
  effect: text("effect").notNull().default("confetti"),
  titleFont: text("title_font").notNull().default("classic"),
  coverImageId: uuid("cover_image_id"),
  coverEmoji: text("cover_emoji").notNull().default("🎂"),
  sections: jsonb("sections").$type<Section[]>().notNull().default([]),
  rsvpSettings: jsonb("rsvp_settings").$type<RsvpSettings>().notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
  updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
});

export const rsvps = pgTable(
  "rsvps",
  {
    id: uuid("id").primaryKey().defaultRandom(),
    eventId: uuid("event_id")
      .notNull()
      .references(() => events.id, { onDelete: "cascade" }),
    name: text("name").notNull(),
    status: text("status", { enum: ["going", "maybe", "no"] }).notNull(),
    adults: integer("adults").notNull().default(1),
    kids: integer("kids").notNull().default(0),
    contact: text("contact").notNull().default(""),
    note: text("note").notNull().default(""),
    editToken: text("edit_token").notNull(),
    createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
    updatedAt: timestamp("updated_at", { withTimezone: true }).notNull().defaultNow(),
  },
  (t) => [index("rsvps_event_idx").on(t.eventId)],
);

export const images = pgTable("images", {
  id: uuid("id").primaryKey().defaultRandom(),
  contentType: text("content_type").notNull(),
  data: bytea("data").notNull(),
  createdAt: timestamp("created_at", { withTimezone: true }).notNull().defaultNow(),
});

export type EventRow = typeof events.$inferSelect;
export type RsvpRow = typeof rsvps.$inferSelect;
