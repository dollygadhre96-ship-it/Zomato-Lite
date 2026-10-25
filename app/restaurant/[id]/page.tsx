"use client";

// Screen 2 — the restaurant page. Order of things on this screen mirrors the API response,
// on purpose. This file receives 4.3 and prints 4.3. It adds nothing, divides nothing,
// sorts nothing. It is a display layer.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams } from "next/navigation";
import type { RestaurantResponse, Review } from "@/lib/types";

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

  const ReviewRow = ({ review, isLatest = false }: { review: Review; isLatest?: boolean }) => (
    <li
      className={
        isLatest
          ? "rounded-xl border-l-4 border-l-[#b45309] border border-[#e8e3da] bg-white p-5"
          : "py-5 px-1"
      }
    >
      {isLatest && (
        <p className="mb-2 text-[11px] font-semibold tracking-widest text-[#b45309] uppercase">
          Latest
        </p>
      )}
      <p className="text-lg text-[#1a1917]">{review.comment}</p>
      <p className="mt-2 text-sm text-[#8a8378]">
        {review.rating} stars · {readableDate(review.createdAt)}
      </p>
    </li>
  );

  if (state.phase === "loading") {
    return (
      <main className="mx-auto max-w-[560px] px-6 py-16">
        <p className="text-[#8a8378]">Loading…</p>
      </main>
    );
  }

  if (state.phase === "error") {
    return (
      <main className="mx-auto max-w-[560px] px-6 py-16">
        <p className="text-[#8a8378]">This restaurant could not be found.</p>
      </main>
    );
  }

  const data = state.data;
  const hasReviews = data.totalReviews > 0;

  return (
    <main className="mx-auto max-w-[560px] min-h-screen px-6 py-14">
      {/* 1. Name */}
      <h1 className="text-2xl font-semibold tracking-tight text-[#1a1917]">
        {data.name}
      </h1>
      <p className="mt-1 text-sm text-[#8a8378]">
        {data.cuisine} · {data.area}
      </p>

      {!hasReviews && (
        <section className="mt-10 rounded-xl border border-[#e8e3da] bg-white p-8 text-center">
          <p className="text-[#1a1917]">No reviews yet.</p>
          <p className="mt-2 text-sm text-[#8a8378]">
            Be the first to review this place.
          </p>
          <Link
            href={`/review/${id}`}
            className="mt-5 inline-block text-sm font-medium text-[#b45309] underline underline-offset-4"
          >
            Write the first review
          </Link>
        </section>
      )}

      {hasReviews && (
        <>
          {/* 2. The average, big. Backend/computed — printed as received, untouched. */}
          <section className="mt-10">
            <div className="flex items-baseline gap-3">
              {/* THE LINE — receives 4.3, prints 4.3. No calculation in this file. */}
              <span className="text-7xl font-semibold tracking-tight text-[#1a1917]">
                {data.averageRating}
              </span>
              <span className="text-sm text-[#8a8378]">
                {data.totalReviews} {data.totalReviews === 1 ? "review" : "reviews"}
              </span>
            </div>
          </section>

          {/* 3. Latest review, highlighted — recency is what people trust. */}
          <section className="mt-10">
            <ul>
              <ReviewRow review={data.latestReview!} isLatest />
            </ul>
          </section>

          {/* 4. The rest, newest first, plain list. (The API already excluded the latest.) */}
          <section className="mt-10">
            <h2 className="mb-2 text-xl font-semibold text-[#1a1917]">Reviews</h2>
            <ul className="divide-y divide-[#e8e3da]">
              {data.reviews.map((review) => (
                <ReviewRow key={review.id} review={review} />
              ))}
            </ul>
          </section>
        </>
      )}

      {/* 5. The invitation */}
      <div className="mt-14 border-t border-[#e8e3da] pt-8">
        <Link
          href={`/review/${id}`}
          className="text-sm font-medium text-[#b45309] underline underline-offset-4"
        >
          Write a review →
        </Link>
      </div>
    </main>
  );
}
