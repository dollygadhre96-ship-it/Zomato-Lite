// A neutral, generic avatar disc.
// We deliberately do NOT render names or initials: the reviews table stores
// no reviewer identity, and inventing one would be mock data. The disc is
// decorative only (aria-hidden), giving the feed rhythm without fabricating
// a person.
export default function AvatarDisc({ className = "" }: { className?: string }) {
  return (
    <svg
      viewBox="0 0 40 40"
      aria-hidden="true"
      className={`h-9 w-9 shrink-0 rounded-full border border-hairline bg-neutral-100 text-neutral-400 ${className}`}
    >
      <circle cx="20" cy="15" r="6.5" fill="currentColor" />
      <path d="M20 23c-7.5 0-11.5 4-11.5 9.5V40h23v-7.5C31.5 27 27.5 23 20 23z" fill="currentColor" />
    </svg>
  );
}
