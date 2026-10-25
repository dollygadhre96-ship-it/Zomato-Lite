// Renders a review's exact integer rating as filled/empty star glyphs.
// It renders the stored value as-is — nothing is rounded, averaged, or computed here.
// The displayed average (which may be a decimal) intentionally does NOT use this
// component; it prints the number the backend computed.
export default function Stars({ rating }: { rating: number }) {
  return (
    <span
      aria-label={`Rated ${rating} out of 5 stars`}
      className="inline-flex gap-0.5 text-[13px] leading-none"
    >
      {[1, 2, 3, 4, 5].map((star) => (
        <span
          key={star}
          aria-hidden
          className={star <= rating ? "text-[#e23744]" : "text-[#e5e5e5]"}
        >
          ★
        </span>
      ))}
    </span>
  );
}
