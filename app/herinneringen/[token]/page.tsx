import { redirect } from "next/navigation";

// Shared invitations are retired: only a personal account grants access now.
export default function MemoriesInvitePage() {
  redirect("/herinneringen");
}
