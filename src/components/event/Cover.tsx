import type { EventView } from "@/lib/event";

export function Cover({ event, imageSrc }: { event: EventView; imageSrc?: string | null }) {
  const src = imageSrc ?? (event.coverImageId ? `/api/images/${event.coverImageId}` : null);
  return (
    <div className="relative aspect-[4/3] w-full @3xl:aspect-square overflow-hidden rounded-[2rem] border border-(--ev-line) shadow-[0_30px_80px_-40px_rgb(0_0_0/0.45)]">
      {src ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img src={src} alt="" className="h-full w-full object-cover" />
      ) : (
        <div className="grid h-full w-full place-items-center bg-(image:--ev-cover)">
          <span className="cover-emoji select-none text-[clamp(6rem,24cqi,11rem)] leading-none">{event.coverEmoji || "🎉"}</span>
        </div>
      )}
    </div>
  );
}
