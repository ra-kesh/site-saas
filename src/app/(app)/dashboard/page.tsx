"use client";

import { useEffect, useMemo, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import {
  useMutation,
  useQuery,
  useQueryClient,
} from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "ofpuri.com";

export default function DashboardPage() {
  const router = useRouter();
  const trpc = useTRPC();
  const queryClient = useQueryClient();

  const sessionQuery = useQuery(trpc.auth.session.queryOptions());
  const sessionUserId = sessionQuery.data?.user?.id;
  const currentSiteQueryOptions = useMemo(
    () => trpc.tenants.getCurrentSite.queryOptions(),
    [trpc]
  );
  const currentSiteQueryKey = useMemo(
    () => trpc.tenants.getCurrentSite.queryKey(),
    [trpc]
  );
  const siteContextQuery = useQuery({
    ...currentSiteQueryOptions,
    enabled: Boolean(sessionUserId),
  });

  const siteContext = siteContextQuery.data;
  const site = siteContext?.site ?? null;
  const tenant = siteContext?.tenant ?? null;
  const isLoading = sessionQuery.isLoading || siteContextQuery.isLoading;

  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    queryClient.setQueryData(currentSiteQueryKey, undefined);
  }, [queryClient, currentSiteQueryKey]);

  useEffect(() => {
    const currentUserId = sessionUserId ?? null;
    const previousUserId = previousUserIdRef.current;

    if (!currentUserId) {
      if (previousUserId) {
        queryClient.removeQueries({ queryKey: currentSiteQueryKey });
        previousUserIdRef.current = null;
      }
      return;
    }

    if (previousUserId && previousUserId !== currentUserId) {
      queryClient.setQueryData(currentSiteQueryKey, undefined);
      queryClient.invalidateQueries({ queryKey: currentSiteQueryKey });
    }

    previousUserIdRef.current = currentUserId;
  }, [queryClient, sessionUserId, currentSiteQueryKey]);

  const generateSite = useMutation<
    { success: boolean },
    Error,
    string | undefined
  >({
    mutationFn: async (targetSlug) => {
      const response = await fetch("/next/seed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(
          targetSlug
            ? {
                siteSlug: targetSlug,
              }
            : {}
        ),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(
          message || "We couldn't generate your template. Try again."
        );
      }

      return response.json() as Promise<{ success: boolean }>;
    },
    onSuccess: () => {
      toast.success(
        "Template generated! Visit your site or open the admin to keep editing."
      );
      void siteContextQuery.refetch();
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "We couldn't generate your template. Try again."
      );
    },
  });

  useEffect(() => {
    if (isLoading) {
      return;
    }

    if (!site) {
      router.replace("/");
    }
  }, [isLoading, site, router]);

  if (isLoading || !tenant) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-24 w-full max-w-xl" />
      </div>
    );
  }

  const welcomeName = sessionQuery.data?.user?.email ?? "there";
  const siteSlug = site?.slug ?? tenant?.slug ?? "";
  const displayDomain = siteSlug
    ? `https://${siteSlug}.${ROOT_DOMAIN}`
    : `https://${ROOT_DOMAIN}`;
  const hasSeeded = Boolean(siteContext?.hasSeeded);

  const handleGenerate = () => {
    const targetSlug = siteSlug.trim();

    if (!targetSlug) {
      toast.error(
        "We couldn't determine your site slug. Please contact support."
      );
      return;
    }

    generateSite.mutate(targetSlug);
  };

  return (
    <div className="space-y-6">
      <div className="space-y-1">
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Welcome back, {welcomeName}.
        </h1>
        <p className="text-base text-muted-foreground">
          Here&apos;s the site you have reserved with us.
        </p>
      </div>

      <Card className="max-w-xl">
        <CardHeader>
          <CardTitle>{site?.name ?? siteSlug}</CardTitle>
          <CardDescription className="text-base text-foreground">
            <Link
              href={displayDomain}
              target="_blank"
              rel="noopener noreferrer"
              className="font-medium text-primary underline-offset-4 hover:underline"
            >
              {displayDomain}
            </Link>
          </CardDescription>
        </CardHeader>
        <CardFooter className="flex flex-wrap items-center gap-3">
          {hasSeeded ? (
            <>
              <Button asChild>
                <Link
                  href={displayDomain}
                  target="_blank"
                  rel="noopener noreferrer"
                >
                  Visit site
                </Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/admin">Open admin</Link>
              </Button>
              <Button
                type="button"
                variant="ghost"
                onClick={handleGenerate}
                disabled={generateSite.isPending}
              >
                {generateSite.isPending
                  ? "Generating template…"
                  : "Regenerate template"}
              </Button>
            </>
          ) : (
            <Button
              type="button"
              onClick={handleGenerate}
              disabled={generateSite.isPending}
            >
              {generateSite.isPending
                ? "Generating template…"
                : "Generate template"}
            </Button>
          )}
        </CardFooter>
      </Card>
    </div>
  );
}
