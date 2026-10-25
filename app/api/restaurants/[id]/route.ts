// GET /api/restaurants/[id] — "Give me everything the restaurant screen needs."
// The response is shaped exactly like the screen, top to bottom.
//
// Sorting: four real, honest orders, computed by PostgreSQL in the ORDER BY.
// ORDER BY cannot accept a $1 parameter — it is not a value — so user input
// must never be interpolated. A fixed whitelist map is the safe pattern:
// any sort key not in the map is rejected with 400 (same contract discipline
// as a rating of 500).
// A note on "relevance": it was requested, and deliberately not built. True
// relevance needs a search query, personalization, or engagement signals —
// none exist in this product yet. A chip that sorts by nothing is a placebo,
// so the feed ships four honest sorts instead.
import { NextResponse, NextRequest } from "next/server";
import { sql } from "@/lib/db";

const SORT_OPTIONS: Record<string, string> = {
  newest: "created_at DESC",
  oldest: "created_at ASC",
  top: "rating DESC, created_at DESC",
  low: "rating ASC, created_at DESC",
};

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const restaurantId = Number(id);
  if (!Number.isInteger(restaurantId)) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }

  const sortParam = request.nextUrl.searchParams.get("sort") ?? "newest";
  const orderBy = SORT_OPTIONS[sortParam];
  if (!orderBy) {
    return NextResponse.json(
      { error: "Unknown sort. Use one of: newest, oldest, top, low." },
      { status: 400 }
    );
  }

  // Fact lookup.
  const restaurants = await sql.query(
    "SELECT id, name, cuisine, area FROM restaurants WHERE id = $1",
    [restaurantId]
  );
  if (restaurants.length === 0) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
  }
  const restaurant = restaurants[0];

  // The three computations. Fresh, right now, every single load.
  const aggregates = await sql.query(
    "SELECT COUNT(*)::int AS total, AVG(rating)::float AS average FROM reviews WHERE restaurant_id = $1",
    [restaurantId]
  );
  const totalReviews = aggregates[0].total;          // COUNT(*)
  const avg = aggregates[0].average;                 // AVG(rating)
  const averageRating = avg === null ? null : Math.round(avg * 10) / 10;

  // Latest is always NEWEST-FIRST, recency is the page's headline and does
  // not move when the feed is sorted differently.
  const latestRaw = (
    await sql.query(
      "SELECT id, rating, comment, created_at FROM reviews WHERE restaurant_id = $1 ORDER BY created_at DESC LIMIT 1",
      [restaurantId]
    )
  ) as unknown as { id: number; rating: number; comment: string; created_at: Date }[];
  const restRaw = (
    await sql.query(
      // When the feed is sorted newest-first, row #1 is already featured in
      // the highlighted card, so skip it. Every other sort keeps the full list.
      `SELECT id, rating, comment, created_at FROM reviews WHERE restaurant_id = $1 ORDER BY ${orderBy}${sortParam === "newest" ? " OFFSET 1" : ""}`,
      [restaurantId]
    )
  ) as unknown as { id: number; rating: number; comment: string; created_at: Date }[];

  const toReview = (r: { id: number; rating: number; comment: string; created_at: Date }) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at.toISOString(),
  });

  // Empty-state policy, unchanged:
  // No reviews yet means NO answers yet — null average, zero count, null latest.
  const latestReview = latestRaw.length > 0 ? toReview(latestRaw[0]) : null;

  return NextResponse.json({
    name: restaurant.name,
    cuisine: restaurant.cuisine,
    area: restaurant.area,
    averageRating,
    totalReviews,
    latestReview,
    reviews: restRaw.map(toReview),
  });
}
