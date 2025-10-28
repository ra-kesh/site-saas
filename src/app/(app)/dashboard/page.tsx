"use client";

import { useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { CheckCircle2, CreditCard, Globe } from "lucide-react";
import { useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import {
  Card,
  CardContent,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Skeleton } from "@/components/ui/skeleton";
import { useTRPC } from "@/trpc/client";
import { cn, generateTenantURL } from "@/lib/utils";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "ofpuri.com";

const statusMeta: Record<
  "pending" | "draft" | "active" | "suspended",
  {
    label: string;
    description: string;
    badgeVariant: "secondary" | "outline" | "default" | "destructive";
  }
> = {
  pending: {
    label: "Reserved",
    description:
      "You have the subdomain locked. Start building your pages next.",
    badgeVariant: "secondary",
  },
  draft: {
    label: "Draft in progress",
    description:
      "Keep editing your block layout and share the preview for feedback.",
    badgeVariant: "secondary",
  },
  active: {
    label: "Live",
    description: "Your site is live. You can manage everything from the admin.",
    badgeVariant: "default",
  },
  suspended: {
    label: "Suspended",
    description: "Reach out to support to reactivate this tenant.",
    badgeVariant: "destructive",
  },
};

export default function DashboardPage() {
  const router = useRouter();
  const trpc = useTRPC();

  const sessionQuery = useQuery(trpc.auth.session.queryOptions());
  const tenantQuery = useQuery({
    ...trpc.tenants.getCurrent.queryOptions(),
    enabled: Boolean(sessionQuery.data?.user),
  });

  useEffect(() => {
    if (sessionQuery.status !== "success") return;

    if (!sessionQuery.data?.user) {
      router.replace("/sign-in?redirect=%2Fdashboard");
    }
  }, [router, sessionQuery.status, sessionQuery.data?.user]);

  const tenant = tenantQuery.data;
  const displayDomain = tenant ? `${tenant.slug}.${ROOT_DOMAIN}` : null;
  const previewUrl = tenant ? generateTenantURL(tenant.slug) : null;

  const statusCopy =
    tenant?.status && tenant.status in statusMeta
      ? statusMeta[tenant.status as keyof typeof statusMeta]
      : null;

  const hasDraft = tenant?.status === "draft" || tenant?.status === "active";
  const isPublished = tenant?.status === "active";

  const checklist = [
    {
      id: "reserve",
      label: "Reserve your domain",
      complete: true,
      description: tenant ? displayDomain : `yourname.${ROOT_DOMAIN}`,
    },
    {
      id: "build",
      label: "Build your site",
      complete: hasDraft,
      description:
        "Use the block editor to add sections, update content, and save progress.",
    },
    {
      id: "subscribe",
      label: "Subscribe to publish",
      complete: isPublished,
      description: isPublished
        ? "Your site is live on the primary domain."
        : "Unlock admin tools and go live once you start your subscription.",
    },
  ];

  if (sessionQuery.isLoading || tenantQuery.isLoading) {
    return (
      <div className="space-y-6">
        <Skeleton className="h-8 w-1/2" />
        <Skeleton className="h-40 w-full" />
        <Skeleton className="h-72 w-full" />
        <Skeleton className="h-48 w-full" />
      </div>
    );
  }

  if (!tenant) {
    return (
      <div className="max-w-3xl">
        <Card>
          <CardHeader>
            <CardTitle>No tenant found</CardTitle>
            <CardDescription>
              We couldn&apos;t locate a workspace for your account. Contact
              support for assistance.
            </CardDescription>
          </CardHeader>
          <CardFooter>
            <Button asChild>
              <Link href="/">Return home</Link>
            </Button>
          </CardFooter>
        </Card>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      <div className="flex flex-col gap-2">
        <Badge variant="outline" className="w-fit">
          Tenant onboarding
        </Badge>
        <h1 className="text-3xl font-semibold tracking-tight text-foreground sm:text-4xl">
          Let&apos;s prepare your site,{" "}
          {sessionQuery.data?.user?.email ?? "there"}.
        </h1>
        <p className="text-base text-muted-foreground">
          Review your reserved domain, start building with blocks, and unlock
          publishing when you&apos;re ready.
        </p>
      </div>

      <div className="grid gap-6 lg:grid-cols-[2fr,1fr]">
        <div className="space-y-6">
          <Card>
            <CardHeader className="flex flex-row items-start justify-between gap-4">
              <div className="space-y-1">
                <CardTitle className="flex items-center gap-2 text-xl">
                  <Globe className="h-5 w-5 text-primary" />
                  {displayDomain
                    ? `https://${displayDomain}`
                    : `https://yourname.${ROOT_DOMAIN}`}
                </CardTitle>
                <CardDescription>
                  This domain is reserved for you on ofpuri. Share the preview
                  once you&apos;re happy with your draft.
                </CardDescription>
              </div>
              {statusCopy && (
                <Badge variant={statusCopy.badgeVariant}>
                  {statusCopy.label}
                </Badge>
              )}
            </CardHeader>
            <CardContent className="space-y-4">
              {statusCopy && (
                <Alert>
                  <AlertTitle>{statusCopy.label}</AlertTitle>
                  <AlertDescription>{statusCopy.description}</AlertDescription>
                </Alert>
              )}
              <div className="rounded-lg border border-dashed border-border bg-background/60 p-4 text-sm text-muted-foreground">
                Invite teammates or update business details once you unlock the
                admin panel. Until then, we keep the workspace draft-only.
                {previewUrl && (
                  <div className="pt-3 text-xs">
                    Preview link:{" "}
                    <Link
                      href={previewUrl}
                      className="font-medium text-primary underline-offset-4 hover:underline"
                    >
                      {previewUrl}
                    </Link>
                  </div>
                )}
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">Launch checklist</CardTitle>
              <CardDescription>
                Track the steps before you unlock the full admin experience.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-4">
              {checklist.map((item) => (
                <div
                  key={item.id}
                  className={cn(
                    "flex items-start gap-3 rounded-lg border border-transparent px-3 py-3",
                    item.complete
                      ? "bg-muted/40"
                      : "border-dashed border-border"
                  )}
                >
                  <CheckCircle2
                    className={cn(
                      "mt-1 h-5 w-5",
                      item.complete ? "text-primary" : "text-muted-foreground"
                    )}
                  />
                  <div className="space-y-1">
                    <p className="text-sm font-medium text-foreground">
                      {item.label}
                    </p>
                    <p className="text-xs text-muted-foreground">
                      {item.description}
                    </p>
                  </div>
                </div>
              ))}
            </CardContent>
          </Card>
        </div>

        <div className="space-y-6">
          <Card>
            <CardHeader className="space-y-1">
              <CardTitle className="text-lg">
                Publish when you&apos;re ready
              </CardTitle>
              <CardDescription>
                Subscribe to unlock the admin tools and push your site live.
              </CardDescription>
            </CardHeader>
            <CardContent className="space-y-3 text-sm text-muted-foreground">
              <p>
                We&apos;ll grant limited admin access through a proxy so you can
                keep editing before you pay. Publishing still requires an active
                subscription.
              </p>
              <p>
                Need help deciding? Our team can walk you through the editor,
                integrations, and best practices.
              </p>
            </CardContent>
            <CardFooter className="flex flex-col gap-3">
              <Button size="sm" className="w-full">
                <CreditCard className="mr-2 h-4 w-4" />
                Start subscription
              </Button>
              <Button asChild size="sm" variant="ghost" className="w-full">
                <Link href="/contact">Talk to us</Link>
              </Button>
            </CardFooter>
          </Card>
        </div>
      </div>
    </div>
  );
}
