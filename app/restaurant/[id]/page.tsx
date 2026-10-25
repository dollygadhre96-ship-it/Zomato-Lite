"use client";

// Screen 2 — the restaurant page.
// Order of sections mirrors the API response, on purpose. This file receives
// 4.5 and prints 4.5: no adding, dividing, counting, or sorting happens here.
// Everything visual (stars, avatars, images) is decorative and aria-hidden.
import { useEffect, useRef, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import SmartImage from "@/components/SmartImage";
import Stars from "@/components/Stars";
import AvatarDisc from "@/components/AvatarDisc";
import type { RestaurantResponse, Review } from "@/lib/types";

type SortKey = "newest" | "oldest" | "top" | "low";

const SORT_LABELS: { key: SortKey; label: string }[] = [
  { key: "newest", label: "Newest first" },
  { key: "oldest", label: "Oldest first" },
  { key: "top", label: "Best rated" },
  { key: "low", label: "Lowest rated" },
];

const COVER_URL =
  "https://images.unsplash.com/photo-1585937421612-70a008356fbe?w=1200&h=675&fit=crop&crop=entropy&auto=format&q=80";

const FOOD_STRIP = [
  {
    src: "https://images.unsplash.com/photo-1631452180519-c014fe946bc7?w=240&h=240&fit=crop&auto=format&q=80",
    alt: "Paneer in a rich tomato gravy",
  },
  {
    src: "https://images.unsplash.com/photo-1599043513900-ed6fe01d3833?w=240&h=240&fit=crop&auto=format&q=80",
    alt: "Biryani served on a plate",
  },
  {
    src: "https://images.unsplash.com/photo-1566740933430-b5e70b06d2d5?w=240&h=240&fit=crop&auto=format&q=80",
    alt: "Freshly wrapped burritos",
  },
];

export default function RestaurantPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  // Sort is a client-side choice, but the ORDER happens in SQL — the backend
  // receives the chosen key, whitelists it, and returns the rows in order.
  // The frontend never calls .sort().
  const [sort, setSort] = useState<SortKey>("newest");
  const [refreshing, setRefreshing] = useState(false);
  const hasLoadedRef = useRef(false);
  const [state, setState] = useState<
    | { phase: "loading" }
    | { phase: "error" }
    | { phase: "ok"; data: RestaurantResponse }
  >({ phase: "loading" });

  useEffect(() => {
    let alive = true;
    // A ref, not state, so switching sort preserves data while refetching
    // without putting state.phase into the dependency contract.
    if (hasLoadedRef.current) setRefreshing(true);
    fetch(`/api/restaurants/${id}?sort=${sort}`)
      .then(async (response) => {
        const body = await response.json();
        if (!alive) return;
        if (!response.ok) {
          setState({ phase: "error" });
          return;
        }
        setState({ phase: "ok", data: body as RestaurantResponse });
        hasLoadedRef.current = true;
        setRefreshing(false);
      })
      .catch(() => {
        if (alive) setRefreshing(false);
      });
    return () => {
      alive = false;
    };
  }, [id, sort]);

  const readableDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });

  if (state.phase === "loading") {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-[560px] px-4 pb-28 sm:px-6">
          <div className="mt-4 aspect-[16/9] animate-pulse rounded-2xl bg-neutral-100" />
          <div className="mt-5 h-8 w-3/5 animate-pulse rounded-lg bg-neutral-100" />
          <div className="mt-2 h-4 w-2/5 animate-pulse rounded bg-neutral-100" />
        </div>
      </main>
    );
  }

  if (state.phase === "error") {
    return (
      <main className="min-h-screen bg-background text-foreground">
        <div className="mx-auto max-w-[560px] px-4 py-20 text-center sm:px-6">
          <p className="text-lg font-medium">This restaurant could not be found.</p>
          <Link
            href="/"
            className="mt-4 inline-block text-sm font-medium text-accent underline underline-offset-4"
          >
            Back to home
          </Link>
        </div>
      </main>
    );
  }

  const data = state.data;
  const hasReviews = data.totalReviews > 0;

  // Display-only grouping: bucket rows by the exact date label shown to the
  // user. It is a string-key map for layout — no arithmetic, no sorting
  // (the order arrives already ordered from SQL).
  const byDate = new Map<string, Review[]>();
  for (const review of data.reviews) {
    const label = readableDate(review.createdAt);
    const list = byDate.get(label) ?? [];
    list.push(review);
    byDate.set(label, list);
  }
  const dateGroups = Array.from(byDate.entries()).map(([label, reviews]) => ({
    label,
    reviews,
  }));

  return (
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[560px] px-4 pb-28 sm:px-6">
        {/* Cover */}
        <div className="relative mt-4 aspect-[16/9] overflow-hidden rounded-2xl border border-hairline bg-neutral-100 shadow-[0_1px_3px_rgba(0,0,0,0.05)]">
          <SmartImage
            src={COVER_URL}
            alt={`${data.name} — ${data.cuisine} food`}
            sizes="(max-width: 560px) 100vw, 560px"
            priority
            className="object-cover"
          />
        </div>

        {/* Name + metadata */}
        <header className="mt-5">
          <h1 className="text-[28px] font-semibold leading-tight tracking-tight">
            {data.name}
          </h1>
          <p className="mt-1.5 text-sm text-muted">
            {data.cuisine} · {data.area}
          </p>
        </header>

        {/* Photo strip — consistent 84px crops, rounded, no captions */}
        <div className="mt-4 flex gap-2" aria-hidden="true">
          {FOOD_STRIP.map((food) => (
            <div
              key={food.src}
              className="relative h-[84px] w-[84px] overflow-hidden rounded-xl border border-hairline bg-neutral-100"
            >
              <SmartImage
                src={food.src}
                alt={food.alt}
                sizes="84px"
                className="object-cover"
              />
            </div>
          ))}
        </div>

        {hasReviews ? (
          <>
            {/* Rating summary — the number is printed exactly as received, "/5" is a literal */}
            <section aria-label="Rating summary" className="mt-8 flex items-end gap-4">
              <div className="flex items-baseline">
                <span className="text-6xl font-bold leading-none tracking-tight">
                  {data.averageRating}
                </span>
                <span className="ml-0.5 text-2xl font-medium text-muted">/5</span>
              </div>
              <div className="pb-0.5">
                <Stars rating={data.averageRating} />
                <p className="mt-1.5 text-xs text-muted">
                  {data.totalReviews} {data.totalReviews === 1 ? "review" : "reviews"}
                </p>
              </div>
            </section>

            {/* Latest review — recency is what people trust */}
            <section aria-label="Latest review" className="mt-9">
              <h2 className="text-xs font-semibold uppercase tracking-widest text-muted">
                Latest review
              </h2>
              <article className="mt-3 rounded-2xl border border-hairline border-l-[3px] border-l-accent bg-white p-5 shadow-[0_1px_2px_rgba(0,0,0,0.04)]">
                <div className="flex items-center justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <AvatarDisc />
                    <Stars rating={data.latestReview!.rating} size="md" />
                  </div>
                  <time className="text-xs text-muted">
                    {readableDate(data.latestReview!.createdAt)}
                  </time>
                </div>
                <p className="mt-3.5 text-[17px] leading-relaxed text-foreground">
                  {data.latestReview!.comment}
                </p>
              </article>
            </section>

            {/* Older reviews — plain feed, the API already excluded the latest */}
            {/* Sort chips — the backend does the ordering; buttons only ask */}
            {data.totalReviews > 0 && (
              <section aria-label="All reviews" className="mt-10">
                <h2 className="text-lg font-semibold tracking-tight">All reviews</h2>
                <div role="group" aria-label="Sort reviews" className="mt-3 flex flex-wrap gap-2">
                  {SORT_LABELS.map(({ key, label }) => {
                    const active = sort === key;
                    return (
                      <button
                        key={key}
                        type="button"
                        aria-pressed={active}
                        onClick={() => active || setSort(key)}
                        className={`h-9 rounded-full px-4 text-[13px] font-medium transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                          active
                            ? "bg-accent text-white shadow-[0_1px_2px_rgba(226,55,68,0.35)]"
                            : "border border-hairline bg-white text-foreground hover:border-neutral-400"
                        }`}
                      >
                        {label}
                      </button>
                    );
                  })}
                </div>

                {data.reviews.length > 0 && (
                  <ul
                    aria-busy={refreshing}
                    className={`mt-4 transition-opacity ${refreshing ? "opacity-50" : ""}`}
                  >
                    {dateGroups.map((group) => (
                      <li key={group.label}>
                        <h3 className="mb-1 mt-5 text-xs font-semibold uppercase tracking-widest text-muted">
                          {group.label}
                        </h3>
                        <ul className="divide-y divide-hairline">
                          {group.reviews.map((review) => (
                            <li key={review.id} className="flex gap-3 py-4">
                              <AvatarDisc />
                              <div className="min-w-0 flex-1">
                                <div className="flex items-center justify-between gap-3">
                                  <div className="flex items-center gap-2">
                                    <Stars rating={review.rating} size="sm" />
                                    <span className="text-xs font-medium text-foreground">
                                      {review.rating}/5
                                    </span>
                                  </div>
                                  <time className="whitespace-nowrap text-xs text-muted">
                                    {readableDate(review.createdAt)}
                                  </time>
                                </div>
                                <p className="mt-1.5 text-[15px] leading-relaxed text-foreground">
                                  {review.comment}
                                </p>
                              </div>
                            </li>
                          ))}
                        </ul>
                      </li>
                    ))}
                  </ul>
                )}
              </section>
            )}
          </>
        ) : (
          <section className="mt-10 rounded-2xl border border-hairline bg-white px-6 py-14 text-center">
            <svg
              viewBox="0 0 48 48"
              aria-hidden="true"
              className="mx-auto h-12 w-12 text-neutral-300"
            >
              <circle cx="24" cy="26" r="14" fill="none" stroke="currentColor" strokeWidth="2.5" />
              <path d="M12 26h24" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
              <path d="M24 10v-4M17 12l-2-3.4M31 12l2-3.4" stroke="currentColor" strokeWidth="2.5" strokeLinecap="round" />
            </svg>
            <h2 className="mt-4 text-lg font-semibold">No reviews yet</h2>
            <p className="mt-1.5 text-sm text-muted">
              Be the first to share your experience.
            </p>
            <Link
              href={`/review/${id}`}
              className="mt-6 inline-flex h-11 items-center justify-center rounded-full bg-accent px-8 text-sm font-semibold text-white hover:bg-[#c92f3b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
            >
              Write the first review
            </Link>
          </section>
        )}
      </div>

      {/* Sticky CTA — present on mobile and desktop, brand red, high contrast */}
      <div className="fixed inset-x-0 bottom-0 border-t border-hairline bg-white/90 p-4 backdrop-blur">
        <div className="mx-auto max-w-[560px]">
          <Link
            href={`/review/${id}`}
            className="flex h-12 w-full items-center justify-center rounded-full bg-accent text-[15px] font-semibold text-white shadow-[0_1px_3px_rgba(226,55,68,0.35)] hover:bg-[#c92f3b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
          >
            Write a review
          </Link>
        </div>
      </div>
    </main>
  );
}
