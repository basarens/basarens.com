import type { Metadata } from "next";
import { MemoriesLogin } from "@/components/memories-login";
import { MemoriesUpload } from "@/components/memories-upload";
import { memoriesAccountAccess } from "@/lib/memories/auth";
import { memoriesConfigured } from "@/lib/memories/server";

export const dynamic = "force-dynamic";
export const metadata: Metadata = { title: "Herinneringen · Bas Arens", robots: { index: false, follow: false }, referrer: "no-referrer" };

export default async function MemoriesPage() {
  const account = await memoriesAccountAccess();
  if (!account) return <MemoriesLogin />;
  return <MemoriesUpload configured={memoriesConfigured()} viewerName={account.displayName} featuredVideoUrl="/api/memories/media/featured-video" featuredPhotoUrl="/api/memories/media/featured-photo" />;
}
