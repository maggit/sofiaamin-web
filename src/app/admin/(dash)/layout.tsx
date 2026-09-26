import type { Metadata } from "next";
import Link from "next/link";
import { logout } from "@/app/admin/actions";
import { requireAdmin } from "@/lib/admin";

export const metadata: Metadata = { title: "Admin", robots: { index: false } };

export default async function AdminLayout({ children }: LayoutProps<"/admin">) {
  const session = await requireAdmin();
  return (
    <div className="min-h-dvh bg-paper">
      <header className="sticky top-0 z-30 border-b border-line bg-paper/85 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-[1600px] items-center justify-between gap-4 px-4 sm:px-6">
          <Link href="/admin" className="font-display text-xl font-medium whitespace-nowrap [font-variation-settings:'SOFT'_100,'WONK'_1]">
            Sofia&rsquo;s parties
          </Link>
          <div className="flex items-center gap-3 text-sm">
            <span className="hidden truncate text-ink-soft sm:inline">{session.user?.email}</span>
            <form action={logout}>
              <button className="rounded-full px-3 py-1.5 font-semibold whitespace-nowrap text-ink-soft hover:bg-paper-2 hover:text-ink">Sign out</button>
            </form>
          </div>
        </div>
      </header>
      {children}
    </div>
  );
}
