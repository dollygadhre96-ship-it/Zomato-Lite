// GET /api/restaurants/[id] — "Give me everything the restaurant screen needs."
// The response is shaped exactly like the screen, top to bottom:
//   name, cuisine, area — facts from the restaurants table
//   averageRating       — computed live: AVG(rating), rounded to 1 decimal
//   totalReviews        — computed live: COUNT(*)
//   latestReview        — computed live: newest by created_at, take one
//   reviews             — every OTHER review, newest first (latest shown separately)
// No average is stored anywhere. None of these numbers exist until this moment.
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

export async function GET(
  _request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const restaurantId = Number(id);
  if (!Number.isInteger(restaurantId)) {
    return NextResponse.json({ error: "Restaurant not found." }, { status: 404 });
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

  const latestRows = await sql.query(
    "SELECT id, rating, comment, created_at FROM reviews WHERE restaurant_id = $1 ORDER BY created_at DESC LIMIT 1",
    [restaurantId]
  );
  const restRows = await sql.query(
    "SELECT id, rating, comment, created_at FROM reviews WHERE restaurant_id = $1 ORDER BY created_at DESC OFFSET 1",
    [restaurantId]
  );

  const toReview = (r: { id: number; rating: number; comment: string; created_at: Date }) => ({
    id: r.id,
    rating: r.rating,
    comment: r.comment,
    createdAt: r.created_at.toISOString(),
  });

  // Empty-state policy, said out loud:
  // No reviews yet means we have NO answers yet — so averageRating is null (nothing
  // meaningful to show), totalReviews is 0, and both lists are empty. The screen shows
  // an empty state inviting the first review instead of making up a number.
  const latestReview = latestRows.length > 0 ? toReview(latestRows[0]) : null;

  return NextResponse.json({
    name: restaurant.name,
    cuisine: restaurant.cuisine,
    area: restaurant.area,
    averageRating,
    totalReviews,
    latestReview,
    reviews: restRows.map(toReview),
  });
}
