// The single door to the database.
// Every backend file imports this one object — so the connection string
// lives in exactly one place (.env.local) and is read in exactly one file (this one).
import { neon } from "@neondatabase/serverless";

// Reads DATABASE_URL from .env.local (or the hosting provider's env vars once deployed).
export const sql = neon(process.env.DATABASE_URL!);
