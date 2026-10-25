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

  // Optional star filter (?rating=4). Same contract discipline as every input:
  // validated server-side, never trusted from the click it came from.
  const ratingParam = request.nextUrl.searchParams.get("rating");
  let ratingFilter: number | null = null;
  if (ratingParam !== null && ratingParam !== "") {
    const n = Number(ratingParam);
    if (!Number.isInteger(n) || n < 1 || n > 5) {
      return NextResponse.json(
        { error: "Rating filter must be a whole number from 1 to 5." },
        { status: 400 }
      );
    }
    ratingFilter = n;
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

  // Rating snapshot — the breakdown is a set of computed ANSWERS, so the
  // backend does the counting (GROUP BY) and the bar percentages. The
  // frontend receives "count 3, width 40%" and prints.
  const snapshotRaw = (await sql.query(
    "SELECT rating::int AS rating, COUNT(*)::int AS count FROM reviews WHERE restaurant_id = $1 GROUP BY rating",
    [restaurantId]
  )) as unknown as { rating: number; count: number }[];
  const ratingSnapshot = [5, 4, 3, 2, 1].map((r) => {
    const row = snapshotRaw.find((x) => x.rating === r);
    const count = row ? row.count : 0;
    return {
      rating: r,
      count,
      percentage:
        totalReviews > 0 ? Math.round((count * 100) / totalReviews) : 0,
    };
  });

  // The feed is a COMPLETE list under every sort. The highlighted card above
  // it is a spotlight on the newest review, not a replacement for it.
  const latestRaw = (
    await sql.query(
      "SELECT id, rating, comment, created_at FROM reviews WHERE restaurant_id = $1 ORDER BY created_at DESC LIMIT 1",
      [restaurantId]
    )
  ) as unknown as { id: number; rating: number; comment: string; created_at: Date }[];

  // Feed list: respect BOTH the sort (whitelisted above) and, when present,
  // the star filter. Parameters stay in $n placeholders — values only.
  const listValues: number[] = [restaurantId];
  let listQuery =
    "SELECT id, rating, comment, created_at FROM reviews WHERE restaurant_id = $1";
  if (ratingFilter !== null) {
    listQuery += " AND rating = $2";
    listValues.push(ratingFilter);
  }
  listQuery += ` ORDER BY ${orderBy}`;
  const restRaw = (
    await sql.query(listQuery, listValues)
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
    ratingSnapshot,
  });
}
