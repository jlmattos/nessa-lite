"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

// Same four tabs, same order, every day — the layout never rearranges itself.
const tabs = [
  { href: "/", label: "Today", emoji: "🐱" },
  { href: "/dance", label: "Stage", emoji: "🩰" },
  { href: "/collection", label: "Friends", emoji: "🐾" },
  { href: "/routine", label: "Routine", emoji: "🗓️" },
];

/** stageDot: today's workout is done and she has not danced yet — a small gold dot on the Stage tab. */
export function BottomNav({ stageDot = false }: { stageDot?: boolean }) {
  const pathname = usePathname();
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-50 border-t border-line bg-surface/90 backdrop-blur-lg">
      <div className="flex max-w-lg mx-auto">
        {tabs.map((t) => {
          const active = t.href === "/" ? pathname === "/" : pathname.startsWith(t.href);
          return (
            <Link
              key={t.href}
              href={t.href}
              prefetch
              className={`flex-1 flex flex-col items-center gap-0.5 pt-3 pb-[max(0.9rem,env(safe-area-inset-bottom))] text-sm font-medium select-none transition-colors ${
                active ? "text-accent-deep" : "text-muted"
              }`}
            >
              <span className="relative text-2xl leading-none" aria-hidden>
                {t.emoji}
                {t.href === "/dance" && stageDot && (
                  <span className="absolute -top-0.5 -right-1.5 w-1.5 h-1.5 rounded-full bg-gold" />
                )}
              </span>
              <span>{t.label}</span>
            </Link>
          );
        })}
      </div>
    </nav>
  );
}
