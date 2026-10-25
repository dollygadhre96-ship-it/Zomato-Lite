// POST /api/reviews — "Here, take this."
// Validates in this order and rejects on the first failure:
//   1. rating must be a whole number from 1 to 5
//   2. comment must be a non-empty string after trimming
//   3. restaurantId must refer to a restaurant that actually exists (DB lookup)
// Then inserts exactly one row into the reviews table and returns 201.
import { NextResponse } from "next/server";
import { sql } from "@/lib/db";

type ReviewBody = {
  restaurantId?: unknown;
  rating?: unknown;
  comment?: unknown;
};

export async function POST(request: Request) {
  let body: ReviewBody;
  try {
    body = (await request.json()) as ReviewBody;
  } catch {
    return NextResponse.json({ error: "Request body must be valid JSON" }, { status: 400 });
  }

  const { restaurantId, rating, comment } = body;

  // Check 1 — rating: whole number, 1 to 5. This is where a 500 is caught and killed.
  if (typeof rating !== "number" || !Number.isInteger(rating) || rating < 1 || rating > 5) {
    return NextResponse.json(
      { error: "Rating must be a whole number between 1 and 5." },
      { status: 400 }
    );
  }

  // Check 2 — comment: a string that still has something in it after trimming whitespace.
  if (typeof comment !== "string" || comment.trim() === "") {
    return NextResponse.json(
      { error: "Comment must be a non-empty piece of text." },
      { status: 400 }
    );
  }

  // Check 3 — the restaurant must actually exist. This one is a real database lookup.
  if (typeof restaurantId !== "number" || !Number.isInteger(restaurantId)) {
    return NextResponse.json(
      { error: "Restaurant ID must be a number." },
      { status: 400 }
    );
  }
  const found = await sql.query(
    "SELECT id FROM restaurants WHERE id = $1",
    [restaurantId]
  );
  if (found.length === 0) {
    return NextResponse.json(
      { error: `Restaurant ${restaurantId} does not exist.` },
      { status: 400 }
    );
  }

  // All three checks passed. Write the ONE fact. Nothing else in the database changes.
  const inserted = await sql.query(
    "INSERT INTO reviews (restaurant_id, rating, comment) VALUES ($1, $2, $3) RETURNING id",
    [restaurantId, rating, comment.trim()]
  );

  return NextResponse.json(
    { success: true, reviewId: inserted[0].id },
    { status: 201 }
  );
}
