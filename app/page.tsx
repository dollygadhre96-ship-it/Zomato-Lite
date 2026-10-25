import Link from "next/link";

export default function Home() {
  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-background px-4 text-foreground">
      <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-accent text-2xl font-bold text-white shadow-[0_1px_3px_rgba(226,55,68,0.35)]">
        Z
      </div>
      <h1 className="mt-5 text-2xl font-semibold tracking-tight">Zomato Lite</h1>
      <p className="mt-1.5 text-sm text-muted">Restaurant reviews, reduced to what matters.</p>
      <div className="mt-8">
        <Link
          href="/restaurant/1"
          className="inline-flex h-11 items-center justify-center rounded-full bg-accent px-8 text-sm font-semibold text-white hover:bg-[#c92f3b] focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-accent"
        >
          Open Ludhiana Burrito
        </Link>
      </div>
    </main>
  );
}
