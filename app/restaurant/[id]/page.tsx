"use client";

// Screen 2 — the restaurant page. Order of things on this screen mirrors the API response,
// on purpose. This file receives 4.3 and prints 4.3. It adds nothing, divides nothing,
// sorts nothing. It is a display layer.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import Stars from "@/lib/stars";
import type { RestaurantResponse, Review } from "@/lib/types";

const CLICKABLE = "text-sm font-medium text-[#e23744] hover:text-[#c92734] underline-offset-4 hover:underline";
const CARD =
  "rounded-2xl border border-[#e9e9e9] bg-white shadow-[0_1px_3px_rgba(0,0,0,0.05)]";
const RED_BUTTON =
  "inline-flex items-center justify-center gap-2 rounded-lg bg-[#e23744] px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-[#c92734]";

export default function RestaurantPage() {
  const params = useParams<{ id: string }>();
  const id = params.id;
  const [state, setState] = useState<
    | { phase: "loading" }
    | { phase: "error" }
    | { phase: "ok"; data: RestaurantResponse }
  >({ phase: "loading" });

  useEffect(() => {
    let alive = true;
    fetch(`/api/restaurants/${id}`)
      .then(async (response) => {
        const body = await response.json();
        if (!alive) return;
        if (!response.ok) {
          setState({ phase: "error" });
          return;
        }
        setState({ phase: "ok", data: body as RestaurantResponse });
      })
      .catch(() => {
        if (alive) setState({ phase: "error" });
      });
    return () => {
      alive = false;
    };
  }, [id]);

  const readableDate = (iso: string) =>
    new Date(iso).toLocaleDateString("en-US", {
      day: "numeric",
      month: "short",
    });

  if (state.phase === "loading") {
    return (
      <main className="mx-auto max-w-[640px] px-5 py-24">
        <p className="text-sm text-[#8f8f8f]">Loading…</p>
      </main>
    );
  }

  if (state.phase === "error") {
    return (
      <main className="mx-auto max-w-[640px] px-5 py-24">
        <p className="text-sm font-medium text-[#1c1c1c]">
          This restaurant could not be found.
        </p>
        <p className="mt-2 text-sm text-[#8f8f8f]">
          Check the address and try again.
        </p>
      </main>
    );
  }

  const data = state.data;
  const hasReviews = data.totalReviews > 0;

  return (
    <main className="mx-auto max-w-[640px] min-h-screen px-5 pb-16 pt-12 sm:px-6">
      {/* 1. Restaurant header */}
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-[#1c1c1c] sm:text-[32px]">
          {data.name}
        </h1>
        <p className="mt-1.5 text-sm text-[#8f8f8f]">
          {data.cuisine} · {data.area}
        </p>
      </header>

      {!hasReviews && (
        /* Empty state — invite the first review instead of showing nothing. */
        <section className={`mt-10 p-8 sm:p-10 ${CARD}`}>
          <p className="text-lg font-semibold text-[#1c1c1c]">No reviews yet</p>
          <p className="mt-1 text-sm leading-relaxed text-[#8f8f8f]">
            Be the first to share what you thought.
          </p>
          <Link href={`/review/${id}`} className={`mt-6 ${RED_BUTTON} w-full sm:w-auto`}>
            Write the first review
          </Link>
        </section>
      )}

      {hasReviews && (
        <>
          {/* 2. Rating summary — the average, big and red. Backend/computed; printed as received. */}
          <section aria-label="Rating summary" className="mt-10">
            <div className="flex items-center gap-5 sm:gap-6">
              {/* THE LINE — receives 4.3, prints 4.3. No calculation in this file. */}
              <span className="text-6xl font-bold leading-none tracking-tight text-[#e23744] sm:text-[64px]">
                {data.averageRating}
              </span>
              <div className="h-12 w-px bg-[#e9e9e9]" aria-hidden />
              <div>
                <p className="text-sm font-semibold text-[#1c1c1c]">
                  {data.totalReviews} {data.totalReviews === 1 ? "review" : "reviews"}
                </p>
                <p className="mt-0.5 text-sm text-[#8f8f8f]">From customers</p>
              </div>
            </div>
          </section>

          {/* 3. Latest review — recency is what people trust, so it sits apart. */}
          <section aria-label="Latest review" className="mt-10">
            <ul>
              <li className={`p-5 sm:p-6 ${CARD}`}>
                <p className="mb-3 text-[11px] font-semibold uppercase tracking-[0.14em] text-[#e23744]">
                  Latest review
                </p>
                <Stars rating={data.latestReview!.rating} />
                <p className="mt-3 text-base leading-relaxed text-[#1c1c1c] sm:text-lg">
                  {data.latestReview!.comment}
                </p>
                <p className="mt-3 text-sm text-[#8f8f8f]">
                  {readableDate(data.latestReview!.createdAt)}
                </p>
              </li>
            </ul>
          </section>

          {/* 4. Older reviews, newest first, easy to scan. */}
          <section className="mt-12">
            <div className="flex items-baseline justify-between">
              <h2 className="text-lg font-semibold text-[#1c1c1c]">All reviews</h2>
              <span className="text-sm text-[#8f8f8f]">
                {data.totalReviews} {data.totalReviews === 1 ? "review" : "reviews"}
              </span>
            </div>
            <ul className="mt-1 divide-y divide-[#e9e9e9]">
              {data.reviews.map((review) => (
                <li key={review.id} className="py-5">
                  <Stars rating={review.rating} />
                  <p className="mt-2.5 text-[15px] leading-relaxed text-[#1c1c1c]">
                    {review.comment}
                  </p>
                  <p className="mt-2 text-sm text-[#8f8f8f]">
                    {readableDate(review.createdAt)}
                  </p>
                </li>
              ))}
            </ul>
          </section>
        </>
      )}

      {/* 5. The invitation */}
      <footer className="mt-14 border-t border-[#e9e9e9] pt-8">
        <Link
          href={`/review/${id}`}
          className={hasReviews ? RED_BUTTON : CLICKABLE}
        >
          Write a review
        </Link>
      </footer>
    </main>
  );
}
