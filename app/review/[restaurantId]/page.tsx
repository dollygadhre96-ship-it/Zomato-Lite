"use client";

// Screen 1 — write a review. The star picker limits the user to 1–5 as kindness.
// The backend re-checks it as security. This screen never decides anything:
// on a 400 it prints the backend's own sentence, verbatim, never its own.
import { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";

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
    <main className="mx-auto max-w-[560px] min-h-screen px-6 py-14">
      <h1 className="text-2xl font-semibold tracking-tight text-[#1a1917]">
        {restaurantName ?? "Loading…"}
      </h1>
      <p className="mt-1 text-sm text-[#8a8378]">Write a review</p>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-medium text-[#1a1917]">Your rating</h2>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((star) => (
            <button
              key={star}
              type="button"
              aria-label={`Rate ${star} ${star === 1 ? "star" : "stars"}`}
              aria-pressed={rating !== null && rating >= star}
              onClick={() => pickStar(star)}
              className={`text-3xl leading-none transition-colors rounded-md px-0.5 ${
                rating !== null && star <= rating
                  ? "text-[#b45309]"
                  : "text-[#d8d2c6] hover:text-[#c9bfae]"
              }`}
            >
              ★
            </button>
          ))}
        </div>
      </section>

      <section className="mt-10">
        <h2 className="mb-3 text-sm font-medium text-[#1a1917]">Your comment</h2>
        <textarea
          value={comment}
          onChange={(event) => setComment(event.target.value)}
          placeholder="What did you think?"
          className="w-full min-h-[120px] resize-none rounded-lg border border-[#e8e3da] bg-white p-4 text-[15px] text-[#1a1917] outline-none placeholder:text-[#c9bfae] focus:border-[#b45309]"
        />
      </section>

      {error && (
        <p className="mt-6 rounded-lg border border-[#b45309] bg-[#fdf7ee] px-4 py-3 text-sm text-[#1a1917]">
          {error}
        </p>
      )}

      <button
        type="button"
        onClick={submit}
        disabled={!canSubmit}
        className="mt-8 w-full rounded-lg bg-[#1a1917] py-3.5 text-[15px] font-medium text-[#faf9f7] disabled:cursor-not-allowed disabled:opacity-40 hover:bg-[#2b2a27]"
      >
        {submitting ? "Submitting…" : "Submit review"}
      </button>
    </main>
  );
}
