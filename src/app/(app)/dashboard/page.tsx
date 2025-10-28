"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useMutation, useQuery } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import {
  Card,
  CardDescription,
  CardFooter,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Skeleton } from "@/components/ui/skeleton";
import { Textarea } from "@/components/ui/textarea";
import { useTRPC } from "@/trpc/client";
import { toast } from "sonner";

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "ofpuri.com";

export default function DashboardPage() {
  const router = useRouter();
  const trpc = useTRPC();

  const sessionQuery = useQuery(trpc.auth.session.queryOptions());
  const tenantQuery = useQuery({
    ...trpc.tenants.getCurrent.queryOptions(),
    enabled: Boolean(sessionQuery.data?.user),
  });

  const tenant = tenantQuery.data;
  const isLoading = sessionQuery.isLoading || tenantQuery.isLoading;

  const [isGenerateOpen, setIsGenerateOpen] = useState(false);
  const [businessName, setBusinessName] = useState("");
  const [businessDescription, setBusinessDescription] = useState("");
  const [primaryAudience, setPrimaryAudience] = useState("");
  const [primaryGoal, setPrimaryGoal] = useState("");
  const [formError, setFormError] = useState<string | null>(null);

  const generateSite = useMutation({
    mutationFn: async (input: {
      tenantSlug: string;
      business: {
        name: string;
        description: string;
        audience: string;
        primaryGoal: string;
      };
    }) => {
      const response = await fetch("/next/seed", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) {
        const message = await response.text();
        throw new Error(
          message || "We couldn't start generating your draft. Try again."
        );
      }

      return response.json() as Promise<{ success: boolean }>;
    },
    onSuccess: () => {
      toast.success("We’re preparing your draft with those details.");
      setIsGenerateOpen(false);
    },
    onError: (error) => {
      toast.error(
        error instanceof Error
          ? error.message
          : "We couldn't start the draft. Try again."
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

  useEffect(() => {
    if (tenant?.name) {
      setBusinessName(tenant.name);
    }
  }, [tenant?.name]);

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
        <CardFooter>
          <Button type="button" onClick={() => setIsGenerateOpen(true)}>
            Generate
          </Button>
        </CardFooter>
      </Card>

      <Dialog
        open={isGenerateOpen}
        onOpenChange={(open) => {
          setIsGenerateOpen(open);
          if (!open) {
            setFormError(null);
            generateSite.reset();
          }
        }}
      >
        <DialogContent className="sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Tell us about your business</DialogTitle>
            <DialogDescription>
              We&apos;ll use these details to pre-fill sections in the block
              editor so you can launch faster.
            </DialogDescription>
          </DialogHeader>
          <form
            className="space-y-4"
            onSubmit={(event) => {
              event.preventDefault();
              const trimmedName = businessName.trim();
              const trimmedDescription = businessDescription.trim();
              const trimmedAudience = primaryAudience.trim();
              const trimmedGoal = primaryGoal.trim();

              if (
                !trimmedName ||
                !trimmedDescription ||
                !trimmedAudience ||
                !trimmedGoal
              ) {
                setFormError(
                  "Please fill in every field so we can tailor your draft."
                );
                return;
              }

              setFormError(null);
              generateSite.mutate({
                tenantSlug: tenant.slug,
                business: {
                  name: trimmedName,
                  description: trimmedDescription,
                  audience: trimmedAudience,
                  primaryGoal: trimmedGoal,
                },
              });
            }}
          >
            <div className="space-y-2">
              <Label htmlFor="business-name">Business name</Label>
              <Input
                id="business-name"
                value={businessName}
                onChange={(event) => setBusinessName(event.target.value)}
                placeholder="e.g. Of Puri Catering"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business-description">
                What does your business do?
              </Label>
              <Textarea
                id="business-description"
                value={businessDescription}
                onChange={(event) =>
                  setBusinessDescription(event.target.value)
                }
                placeholder="Share the products, services, or experience you provide."
                minLength={10}
                rows={4}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business-audience">Primary audience</Label>
              <Input
                id="business-audience"
                value={primaryAudience}
                onChange={(event) => setPrimaryAudience(event.target.value)}
                placeholder="e.g. Boutique event planners, couples, local shoppers"
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="business-goal">Main call to action</Label>
              <Input
                id="business-goal"
                value={primaryGoal}
                onChange={(event) => setPrimaryGoal(event.target.value)}
                placeholder="e.g. Book a tasting, Visit our store, Request a quote"
                required
              />
            </div>
            {formError ? (
              <p className="text-sm text-destructive">{formError}</p>
            ) : null}
            <DialogFooter>
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsGenerateOpen(false)}
                disabled={generateSite.isPending}
              >
                Cancel
              </Button>
              <Button type="submit" disabled={generateSite.isPending}>
                {generateSite.isPending ? "Generating…" : "Generate draft plan"}
              </Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
