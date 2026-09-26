import type { Metadata } from "next";
import { cookies } from "next/headers";
import { notFound } from "next/navigation";
import { EventPage } from "@/components/event/EventPage";
import { RsvpCard } from "@/components/event/RsvpCard";
import { db } from "@/db";
import { rsvps } from "@/db/schema";
import { rsvpClosedReason, rsvpCookieName, toView, type MyRsvp } from "@/lib/event";
import { closeEndedEvents, getEventBySlug, guestSummary } from "@/lib/queries";
import { formatEventDate } from "@/lib/time";
import { and, eq } from "drizzle-orm";

export async function generateMetadata({ params }: PageProps<"/e/[slug]">): Promise<Metadata> {
  const { slug } = await params;
  const row = await getEventBySlug(slug);
  if (!row) return {};
  const e = toView(row);
  const date = formatEventDate(e.startsAt, e.endsAt, e.timezone);
  const description = [date && `${date.day}, ${date.times}`, e.locationName].filter(Boolean).join(" · ") || "You're invited!";
  return {
    title: e.title,
    description,
    openGraph: {
      title: e.title,
      description,
      images: e.coverImageId ? [`/api/images/${e.coverImageId}`] : undefined,
    },
  };
}

export default async function EventRoute({ params }: PageProps<"/e/[slug]">) {
  const { slug } = await params;
  await closeEndedEvents();
  const row = await getEventBySlug(slug);
  if (!row) notFound();
  const event = toView(row);

  const token = (await cookies()).get(rsvpCookieName(event.id))?.value;
  const [mine] = token
    ? await db
        .select({ name: rsvps.name, status: rsvps.status, adults: rsvps.adults, kids: rsvps.kids, email: rsvps.email, phone: rsvps.phone, note: rsvps.note })
        .from(rsvps)
        .where(and(eq(rsvps.eventId, event.id), eq(rsvps.editToken, token)))
        .limit(1)
    : [];
  const summary = await guestSummary(event.id);
  const closedReason = rsvpClosedReason(event);

  return (
    <EventPage
      event={event}
      summary={summary}
      rsvp={<RsvpCard slug={event.slug} settings={event.rsvpSettings} mine={(mine as MyRsvp) ?? null} closedReason={closedReason} />}
    />
  );
}
