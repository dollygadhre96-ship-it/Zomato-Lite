// The contract between backend and frontend, written down.
// The backend (app/api/restaurants/[id]/route.ts) promises this exact shape;
// these types let TypeScript refuse to build if the frontend tries to read
// anything the backend never promised.
export type Review = {
  id: number;
  rating: number;
  comment: string;
  createdAt: string;
};

// One horizontal bar of the rating snapshot. count/percentage are computed
// by the backend (answers, not facts); the frontend only prints.
export type RatingSnapshotRow = {
  rating: number;
  count: number;
  percentage: number;
};

export type RestaurantResponse = {
  name: string;
  cuisine: string;
  area: string;
  averageRating: number | null;
  totalReviews: number;
  latestReview: Review | null;
  reviews: Review[];
  ratingSnapshot: RatingSnapshotRow[];
};
