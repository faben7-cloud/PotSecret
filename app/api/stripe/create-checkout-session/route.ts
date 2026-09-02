import { NextResponse } from "next/server";

// Deprecated: all Checkout sessions are created by prepareContributionAction,
// which reloads and validates the pot server-side before persisting a pending contribution.
export async function POST() {
  return NextResponse.json({ error: "Use the canonical contribution flow." }, { status: 410 });
}
