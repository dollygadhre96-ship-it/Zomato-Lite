// Applies db/schema.sql then db/seed.sql against the database in .env.local,
// then prints the rows it created. Run with: npm run db:setup
import { readFileSync } from "node:fs";
import { neon } from "@neondatabase/serverless";

const url = readFileSync(".env.local", "utf8").match(/^DATABASE_URL=(.+)$/m)[1].trim();
const sql = neon(url);

async function apply(file, label) {
  const statements = readFileSync(file, "utf8")
    .split(";")
    .map((s) => s.trim())
    .filter(Boolean);
  for (const statement of statements) await sql.query(statement);
  console.log(`OK   ${label} — ${statements.length} statement(s) applied`);
}

await apply("db/schema.sql", "schema");
await apply("db/seed.sql", "seed");

const restaurants = await sql.query("SELECT * FROM restaurants ORDER BY id");
const reviews = await sql.query("SELECT * FROM reviews ORDER BY id");

console.log("\nRestaurants table:");
for (const r of restaurants) {
  console.log(`  id=${r.id}  name="${r.name}"  cuisine=${r.cuisine}  area=${r.area}`);
}

console.log("\nReviews table:");
for (const r of reviews) {
  console.log(`  id=${r.id}  restaurant_id=${r.restaurant_id}  rating=${r.rating}  created=${r.created_at.toISOString()}  comment="${r.comment}"`);
}
