import type { ReactNode } from "react";
import { type EventView, type GuestSummary } from "@/lib/event";
import { getTheme, themeStyle } from "@/lib/themes";
import { formatEventDate } from "@/lib/time";
import { getTitleFont } from "@/lib/title-fonts";
import { Cover } from "./Cover";
import { CalendarIcon } from "./Icons";
import { SectionView } from "./Sections";
import { Sprinkles } from "./Sprinkles";

function googleCalendarUrl(event: EventView) {
  if (!event.startsAt) return null;
  const fmt = (iso: string) => iso.replace(/[-:]/g, "").replace(/\.\d{3}/, "");
  const end = event.endsAt ?? new Date(new Date(event.startsAt).getTime() + 3 * 3600_000).toISOString();
  const params = new URLSearchParams({
    action: "TEMPLATE",
    text: event.title,
    dates: `${fmt(event.startsAt)}/${fmt(end)}`,
    location: [event.locationName, event.locationAddress].filter(Boolean).join(", "),
  });
  return `https://calendar.google.com/calendar/render?${params}`;
}

export function EventPage({
  event,
  summary,
  rsvp,
  banner,
  coverSrc,
  contained = false,
}: {
  event: EventView;
  summary: GuestSummary;
  /** The RSVP card (a client component on the live page, a disabled copy in the editor preview). */
  rsvp: ReactNode;
  banner?: ReactNode;
  coverSrc?: string | null;
  /** Render inside a scrolling preview pane rather than the full viewport. */
  contained?: boolean;
}) {
  const theme = getTheme(event.theme);
  const font = getTitleFont(event.titleFont);
  const date = formatEventDate(event.startsAt, event.endsAt, event.timezone);
  const gcal = googleCalendarUrl(event);

  return (
    <div
      className={`ev-root @container relative isolate text-(--ev-ink) ${contained ? "min-h-full" : "min-h-dvh"}`}
      style={{ ...themeStyle(theme), "--ev-title-font": font.family, "--ev-title-settings": font.settings, "--ev-title-weight": font.weight, "--ev-title-tracking": font.tracking } as React.CSSProperties}
    >
      <Sprinkles effect={event.effect} colors={theme.sprinkles} contained={contained} />
      {banner}
      <main className={`relative mx-auto grid max-w-6xl gap-6 px-4 pb-24 @xl:px-6 @3xl:grid-cols-[minmax(0,1.1fr)_minmax(0,0.9fr)] @3xl:grid-rows-[auto_auto_1fr] @3xl:gap-x-10 @3xl:gap-y-6 ${contained ? "pt-8" : "pt-10 @3xl:pt-20"}`}>
        <div className="order-1 @3xl:col-start-2 @3xl:row-span-2 @3xl:row-start-1">
          <Cover event={event} imageSrc={coverSrc} />
        </div>

        <header className="order-2 @3xl:col-start-1 @3xl:row-start-1">
          <h1 className="ev-title text-[clamp(2.75rem,8.5cqi,5.25rem)] leading-[0.98]">{event.title || "Untitled party"}</h1>
          {date ? (
            <div className="mt-5 flex items-start gap-3">
              <CalendarIcon className="mt-1.5 shrink-0 text-(--ev-accent)" width={24} height={24} />
              <div>
                <p className="text-xl font-semibold @xl:text-2xl">{date.day}</p>
                <p className="text-(--ev-muted)">{date.times}</p>
                <p className="mt-1.5 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                  <a href={`/e/${event.slug}/calendar.ics`} className="ev-link">Add to calendar</a>
                  {gcal && <a href={gcal} target="_blank" rel="noreferrer" className="ev-link">Google Calendar</a>}
                </p>
              </div>
            </div>
          ) : (
            <p className="mt-5 text-xl text-(--ev-muted)">Date coming soon</p>
          )}
        </header>

        <div className="order-3 @3xl:col-start-2 @3xl:row-start-3">{rsvp}</div>

        <div className="order-4 space-y-5 @3xl:col-start-1 @3xl:row-span-2 @3xl:row-start-2">
          {event.sections
            .filter((s) => s.enabled)
            .map((s) => (
              <SectionView key={s.id} section={s} event={event} summary={summary} />
            ))}
        </div>
      </main>
    </div>
  );
}
