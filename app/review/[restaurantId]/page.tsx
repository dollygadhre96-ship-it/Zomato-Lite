"use client";

// Screen 1 — write a review. The star picker limits the user to 1–5 as kindness.
// The backend re-checks it as security. This screen never decides anything:
// on a 400 it prints the backend's own sentence, verbatim, never its own.
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import Link from "next/link";

export default function ReviewPage() {
  const params = useParams<{ restaurantId: string }>();
  const id = params.restaurantId;
  const router = useRouter();

  const [restaurantName, setRestaurantName] = useState<string | null>(null);
  const [rating, setRating] = useState<number | null>(null);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Ask the (only) API for the name, so the screen knows what it is reviewing.
  useEffect(() => {
    let alive = true;
    fetch(`/api/restaurants/${id}`)
      .then(async (response) => {
        const body = await response.json();
        if (alive && response.ok) setRestaurantName(body.name as string);
      })
      .catch(() => undefined);
    return () => {
      alive = false;
    };
  }, [id]);

  const canSubmit = rating !== null && comment.trim() !== "" && !submitting;

  const pickStar = (star: number) => {
    setRating(star);
    setError(null);
  };

  const submit = async () => {
    if (!canSubmit) return;
    setSubmitting(true);
    setError(null);
    try {
      const response = await fetch("/api/reviews", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ restaurantId: Number(id), rating, comment }),
      });
      const body = await response.json();
      if (!response.ok) {
        // Show the backend's own reason, exactly as it was said.
        setError(typeof body.error === "string" ? body.error : "Something went wrong.");
        setSubmitting(false);
        return;
      }
      router.push(`/restaurant/${id}`);
    } catch {
      setError("Could not reach the server. Try again.");
      setSubmitting(false);
    }
  };

  return (
    <main className="mx-auto max-w-[640px] min-h-screen px-5 pb-16 pt-12 sm:px-6">
      <header>
        <h1 className="text-3xl font-bold tracking-tight text-[#1c1c1c] sm:text-[32px]">
          {restaurantName ?? "Loading…"}
        </h1>
        <p className="mt-1.5 text-sm text-[#8f8f8f]">Write a review</p>
      </header>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold text-[#1c1c1c]">Your rating</h2>
        <div className="flex gap-1">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              aria-label={`Rate ${star} ${star === 1 ? "star" : "stars"}`}
              aria-pressed={rating !== null && star <= rating}
              onClick={() => pickStar(star)}
              className={`rounded-md px-1 text-[32px] leading-none outline-none transition-colors focus-visible:ring-2 focus-visible:ring-[#e23744]/40 ${
                rating !== null && star <= rating
                  ? "text-[#e23744]"
                  : "text-[#dcdcdc] hover:text-[#eab0b5]"
              }`}
            >
              ★
            </button>
          ))}
        </div>
        <p className="mt-2 text-sm text-[#8f8f8f]">
          {rating === null
            ? "Tap a star"
            : `${rating} out of 5`}
        </p>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-semibold text-[#1c1c1c]">Your comment</h2>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="What did you think?"
          className="w-full min-h-[130px] resize-none rounded-xl border border-[#e9e9e9] bg-white p-4 text-[15px] leading-relaxed text-[#1c1c1c] outline-none placeholder:text-[#bcbcbc] focus:border-[#e23744]"
        />
      </section>

      {error && (
        <p
          role="alert"
          className="mt-6 rounded-xl border border-[#fbd3d6] bg-[#fff7f7] px-4 py-3 text-sm text-[#1c1c1c]"
        >
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        className="mt-8 w-full rounded-lg bg-[#e23744] py-3.5 text-[15px] font-medium text-white transition-colors hover:bg-[#c92734] disabled:cursor-not-allowed disabled:opacity-40"
      >
        {submitting ? "Submitting…" : "Submit review"}
      </button>

      <p className="mt-6 text-center">
        <Link
          href={`/restaurant/${id}`}
          className="text-sm text-[#8f8f8f] underline-offset-4 hover:text-[#1c1c1c] hover:underline"
        >
          ← Back to reviews
        </Link>
      </p>
    </main>
  );
}
