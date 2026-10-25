// Decorative star row. aria-hidden on purpose: the star GLYPHS are not the
// accessible truth — the numeric rating printed beside them is. A screen
// reader hears "4.5", five red icons stay silent.
// NOTE on the round(): this is display mapping only (choosing how many icons
// are filled for a number the backend already computed). No averaging,
// counting, or sorting lives in the frontend.
type StarsProps = {
  rating: number | null;
  size?: "sm" | "md" | "lg";
  className?: string;
};

export default function Stars({ rating, size = "md", className = "" }: StarsProps) {
  const dimensionClass =
    size === "sm" ? "text-[13px]" : size === "lg" ? "text-[22px]" : "text-[17px]";
  const filled = rating === null ? 0 : Math.round(rating);

  return (
    <span className={`inline-flex ${dimensionClass} ${className}`} aria-hidden="true">
      {[1, 2, 3, 4, 5].map((star) => (
        <span key={star} className={star <= filled ? "text-accent" : "text-neutral-300"}>
          ★
        </span>
      ))}
    </span>
  );
}
