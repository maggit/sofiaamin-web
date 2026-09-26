"use server";

import { and, eq, ne } from "drizzle-orm";
import { nanoid } from "nanoid";
import { revalidatePath } from "next/cache";
import { cookies } from "next/headers";
import { z } from "zod";
import { db } from "@/db";
import { rsvps } from "@/db/schema";
import { rsvpClosedReason, rsvpCookieName, toView } from "@/lib/event";
import { getEventBySlug } from "@/lib/queries";

export type RsvpState = { ok: boolean; error?: string; at?: number };

const count = z.coerce.number().int().min(0).max(20);

const input = z.object({
  slug: z.string().max(100),
  name: z.string().trim().min(1, "Please tell us your name.").max(80),
  status: z.enum(["going", "maybe", "no"]),
  adults: count.default(1),
  kids: count.default(0),
  email: z.string().trim().max(200).regex(/^[^\s@]+@[^\s@]+\.[^\s@]+$/, "That email doesn't look right.").or(z.literal("")).default(""),
  phone: z.string().trim().max(40).default(""),
  note: z.string().trim().max(1000).default(""),
  website: z.string().max(0).optional(), // honeypot
});

export async function submitRsvp(_prev: RsvpState, formData: FormData): Promise<RsvpState> {
  const raw = Object.fromEntries([...formData.entries()].filter(([, v]) => v !== ""));
  const parsed = input.safeParse(raw);
  if (!parsed.success) return { ok: false, error: parsed.error.issues[0]?.message ?? "Something looks off." };
  const data = parsed.data;

  const row = await getEventBySlug(data.slug);
  if (!row) return { ok: false, error: "We couldn't find this party." };
  const event = toView(row);
  const closed = rsvpClosedReason(event);
  if (closed) return { ok: false, error: closed };

  const s = event.rsvpSettings;
  const adults = s.askCounts && data.status !== "no" ? data.adults : data.status === "no" ? 0 : 1;
  const kids = s.askCounts && data.status !== "no" ? data.kids : 0;
  if (data.status !== "no" && adults + kids === 0) return { ok: false, error: "Add at least one guest." };
  const askContact = s.askContact && data.status !== "no";
  const email = askContact ? data.email : "";
  const phone = askContact ? data.phone : "";
  if (phone && phone.replace(/\D/g, "").length < 7) return { ok: false, error: "That phone number doesn't look right." };
  if (askContact && s.contactRequired && !email && !phone) {
    return { ok: false, error: "Please add a phone number or email so we can send updates." };
  }

  const jar = await cookies();
  const token = jar.get(rsvpCookieName(event.id))?.value;
  const [existing] = token
    ? await db.select().from(rsvps).where(and(eq(rsvps.eventId, event.id), eq(rsvps.editToken, token))).limit(1)
    : [];

  if (data.status === "going" && event.capacity) {
    const others = await db
      .select({ adults: rsvps.adults, kids: rsvps.kids })
      .from(rsvps)
      .where(and(eq(rsvps.eventId, event.id), eq(rsvps.status, "going"), existing ? ne(rsvps.id, existing.id) : undefined));
    const taken = others.reduce((n, r) => n + r.adults + r.kids, 0);
    const left = event.capacity - taken;
    if (adults + kids > left) {
      return { ok: false, error: left > 0 ? `Sorry, only ${left} spot${left === 1 ? "" : "s"} left.` : "Sorry, the party is full. You can still RSVP maybe." };
    }
  }

  const values = { name: data.name, status: data.status, adults, kids, email, phone, note: s.askNote ? data.note : "", updatedAt: new Date() };
  if (existing) {
    await db.update(rsvps).set(values).where(eq(rsvps.id, existing.id));
  } else {
    const editToken = nanoid(32);
    await db.insert(rsvps).values({ ...values, eventId: event.id, editToken });
    jar.set(rsvpCookieName(event.id), editToken, {
      httpOnly: true,
      sameSite: "lax",
      secure: process.env.NODE_ENV === "production",
      maxAge: 60 * 60 * 24 * 365,
      path: "/",
    });
  }

  revalidatePath(`/e/${event.slug}`);
  return { ok: true, at: Date.now() };
}
