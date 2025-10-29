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
  const tenantQueryOptions = useMemo(
    () => trpc.tenants.getCurrent.queryOptions(),
    [trpc]
  );
  const tenantQueryKey = useMemo(
    () => trpc.tenants.getCurrent.queryKey(),
    [trpc]
  );
  const tenantQuery = useQuery({
    ...tenantQueryOptions,
    enabled: Boolean(sessionUserId),
  });

  const tenant = tenantQuery.data;
  const isLoading = sessionQuery.isLoading || tenantQuery.isLoading;

  const previousUserIdRef = useRef<string | null>(null);

  useEffect(() => {
    queryClient.setQueryData(tenantQueryKey, undefined);
  }, [queryClient, tenantQueryKey]);

  useEffect(() => {
    const currentUserId = sessionUserId ?? null;
    const previousUserId = previousUserIdRef.current;

    if (!currentUserId) {
      if (previousUserId) {
        queryClient.removeQueries({ queryKey: tenantQueryKey });
        previousUserIdRef.current = null;
      }
      return;
    }

    if (previousUserId && previousUserId !== currentUserId) {
      queryClient.setQueryData(tenantQueryKey, undefined);
      queryClient.invalidateQueries({ queryKey: tenantQueryKey });
    }

    previousUserIdRef.current = currentUserId;
  }, [queryClient, sessionUserId, tenantQueryKey]);

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
                tenantSlug: targetSlug,
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
      void tenantQuery.refetch();
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

    if (!tenant) {
      router.replace("/");
    }
  }, [isLoading, tenant, router]);

  const handleGenerate = () => {
    const targetSlug = tenant?.slug?.trim();

    if (!targetSlug) {
      toast.error(
        "We couldn't determine your tenant slug. Please contact support."
      );
      return;
    }

    generateSite.mutate(targetSlug);
  };

  if (isLoading || !tenant) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/3" />
        <Skeleton className="h-24 w-full max-w-xl" />
      </div>
    );
  }

  const welcomeName = sessionQuery.data?.user?.email ?? "there";
  const displayDomain = `https://${tenant.slug}.${ROOT_DOMAIN}`;
  const hasSeeded = Boolean(tenant.hasSeeded);

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
          <CardTitle>{tenant.name ?? tenant.slug}</CardTitle>
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
