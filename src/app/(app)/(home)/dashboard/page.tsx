export const dynamic = "force-dynamic";
export const revalidate = 0;

import Link from "next/link";
import { redirect } from "next/navigation";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { caller } from "@/trpc/server";
import { LogoutButton } from "./logout-button";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "ofpuri.com";

type DashboardProps = {
  domain?: string | null;
};

const Dashboard = ({ domain }: DashboardProps) => {
  return (
    <div className="bg-background flex min-h-screen flex-col">
      <header className="border-b bg-background">
        <div className="mx-auto flex w-full max-w-5xl items-center justify-between px-6 py-4">
          <Link
            href="/"
            className="text-lg font-semibold text-foreground transition-colors hover:text-primary"
          >
            Sites of Puri
          </Link>
          <LogoutButton />
        </div>
      </header>
      <main className="mx-auto flex w-full max-w-5xl flex-1 flex-col px-6 py-10">
        <Card className="max-w-2xl">
          <CardHeader>
            <CardTitle>Website</CardTitle>
            <CardDescription>Your free domain is reserved.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Domain</p>
              <p className="text-xl font-semibold text-foreground">
                {domain ?? "Domain pending setup"}
              </p>
            </div>
            <Button asChild size="lg">
              <Link href="/generate">Generate</Link>
            </Button>
          </CardContent>
        </Card>
      </main>
    </div>
  );
};

const DashboardPage = async () => {
  const session = await caller.auth.session();

  if (!session.user) {
    redirect("/sign-in");
  }

  const sitename =
    typeof session.user?.sitename === "string" ? session.user.sitename : null;

  const domain = sitename ? `${sitename}.${ROOT_DOMAIN}` : null;

  return <Dashboard domain={domain} />;
};

export default DashboardPage;
