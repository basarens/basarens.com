import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { MemoriesUpload } from "@/components/memories-upload";
import { memoriesConfigured, validMemoriesToken } from "@/lib/memories/server";

export const metadata: Metadata = {
  title: "Deel je foto’s met Bas",
  description: "Vakanties, slechte dansmoves en goed bewijsmateriaal. Stuur je foto’s naar Bas.",
  robots: { index: false, follow: false },
  referrer: "no-referrer",
};

export default async function MemoriesInvitePage({ params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  if (!validMemoriesToken(token)) notFound();
  return <MemoriesUpload token={token} configured={memoriesConfigured()} featuredVideoUrl={process.env.MEMORIES_FEATURE_VIDEO_URL} />;
}
