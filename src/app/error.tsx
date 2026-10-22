"use client";

/**
 * Shown when a page could not load (a lost connection, a database hiccup).
 * Plain words and one clear action: nothing she did caused it.
 */
export default function ErrorPage({ reset }: { error: Error & { digest?: string }; reset: () => void }) {
  return (
    <div className="max-w-lg mx-auto px-5 pt-8">
      <div className="rounded-[1.25rem] bg-surface border border-line text-center py-10 px-6">
        <p className="text-3xl mb-2">🐾</p>
        <p className="font-semibold text-lg">This page didn’t load</p>
        <p className="text-sm text-muted mt-1">The connection may have dropped for a moment.</p>
        <button
          onClick={reset}
          className="mt-5 w-full h-14 rounded-2xl bg-accent text-white text-lg font-semibold shadow-sm"
        >
          Try again
        </button>
      </div>
    </div>
  );
}
