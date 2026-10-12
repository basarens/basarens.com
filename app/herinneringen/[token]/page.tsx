import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MemoriesUpload } from "@/components/memories-upload";
import { memoriesConfigured, memoriesFeaturedPhotoUrl, memoriesFeaturedVideoUrl, validMemoriesToken } from "@/lib/memories/server";

export const dynamic = "force-dynamic";

export const metadata: Metadata = {
  title: "Deel je foto’s met Bas",
  description: "Vakanties, slechte dansmoves en goed bewijsmateriaal. Stuur je foto’s naar Bas.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function MemoriesInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!validMemoriesToken(token)) notFound();
  const [featuredVideoUrl, featuredPhotoUrl] = await Promise.all([memoriesFeaturedVideoUrl(), memoriesFeaturedPhotoUrl()]);
  return <MemoriesUpload token={token} configured={memoriesConfigured()} featuredVideoUrl={featuredVideoUrl} featuredPhotoUrl={featuredPhotoUrl} />;
}
