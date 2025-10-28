import { redirect } from "next/navigation";

import { caller } from "@/trpc/server";

import { SignInView } from "@/modules/auth/ui/views/sign-in-view";

export const dynamic = "force-dynamic";

const Page = async () => {
  const session = await caller.auth.session();

  if (session.user) {
    redirect("/dashboard");
  }

  return <SignInView />
}
 
export default Page;
