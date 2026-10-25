"use client";

// Screen 1 — write a review.
// The star picker limiting 1–5 is kindness; the backend re-checking is security.
// On a 400 this screen prints the backend's own sentence, verbatim — never its own.
// Data flows only through /api/*; nothing here invents content.
import { useEffect, useState } from "react";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import SmartImage from "@/components/SmartImage";

const REVIEW_PAGE_THUMB =
  "https://images.unsplash.com/photo-1566740933430-b5e70b06d2d5?w=240&h=240&fit=crop&auto=format&q=80";

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
    <main className="min-h-screen bg-background text-foreground">
      <div className="mx-auto max-w-[560px] px-4 pb-16 sm:px-6">
        <Link
          href={`/restaurant/${id}`}
          className="mt-5 inline-flex items-center gap-1 text-sm font-medium text-muted hover:text-foreground focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          <span aria-hidden="true">←</span> Back to restaurant
        </Link>

        {/* Restaurant identity — name from the API, thumbnail decorative */}
        <header className="mt-5 flex items-center gap-4">
          <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-xl border border-hairline bg-neutral-100">
            <SmartImage
              src={REVIEW_PAGE_THUMB}
              alt=""
              sizes="56px"
              className="object-cover"
            />
          </div>
          <div>
            <h1 className="text-[22px] font-semibold leading-tight tracking-tight">
              {restaurantName ?? "Loading…"}
            </h1>
            <p className="mt-0.5 text-sm text-muted">Write a review</p>
          </div>
        </header>

        {/* Star picker — kindness here; the real gatekeepers live in the backend */}
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-medium text-foreground">Your rating</h2>
          <div role="radiogroup" aria-label="Your rating" className="flex gap-1.5">
            {[1, 2, 3, 4, 5].map((star) => {
              const selected = rating !== null && rating >= star;
              return (
                <button
                  key={star}
                  type="button"
                  role="radio"
                  aria-checked={rating === star}
                  aria-label={`${star} ${star === 1 ? "star" : "stars"}`}
                  onClick={() => pickStar(star)}
                  className={`rounded-md px-1 text-4xl leading-none transition-colors focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent ${
                    selected
                      ? "text-accent"
                      : "text-neutral-300 hover:text-accent/70"
                  }`}
                >
                  ★
                </button>
              );
            })}
          </div>
        </section>

        {/* Comment box */}
        <section className="mt-10">
          <h2 className="mb-3 text-sm font-medium text-foreground">Your comment</h2>
          <textarea
            value={comment}
            onChange={(event) => setComment(event.target.value)}
            placeholder="What did you think?"
            className="min-h-[130px] w-full resize-none rounded-2xl border border-hairline bg-white p-4 text-[15px] leading-relaxed text-foreground outline-none transition-colors placeholder:text-neutral-400 focus:border-accent focus:ring-4 focus:ring-accent/10"
          />
        </section>

        {error && (
          <p
            role="alert"
            className="mt-6 rounded-xl border border-accent/30 bg-accent/5 px-4 py-3 text-sm text-foreground"
          >
            {error}
          </p>
        )}

        <button
          type="button"
          onClick={submit}
          disabled={!canSubmit}
          className="mt-8 h-12 w-full rounded-full bg-accent text-[15px] font-semibold text-white transition-colors hover:bg-[#c92f3b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:bg-accent"
        >
          {submitting ? "Submitting…" : "Submit review"}
        </button>
      </div>
    </main>
  );
}
