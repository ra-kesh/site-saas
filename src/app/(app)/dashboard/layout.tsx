import { getQueryClient } from "@/trpc/server";
import DashboardNav from "./_component/dashboard-nav";
import { dehydrate, HydrationBoundary } from "@tanstack/react-query";

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const queryClient = getQueryClient();
  //  void queryClient.prefetchQuery(trpc.categories.getMany.queryOptions());

  return (
    <div className="min-h-screen bg-muted/10">
      <HydrationBoundary state={dehydrate(queryClient)}>
        <DashboardNav />
        <main>
          <div className="mx-auto max-w-6xl px-6 py-12">{children}</div>
        </main>
      </HydrationBoundary>
    </div>
  );
}
