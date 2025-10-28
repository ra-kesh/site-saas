"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { useQuery } from "@tanstack/react-query";

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

      <Dialog open={isGenerateOpen} onOpenChange={setIsGenerateOpen}>
        <DialogContent className="sm:max-w-2xl md:max-w-3xl">
          <DialogHeader>
            <DialogTitle>Tell us about your business</DialogTitle>
            <DialogDescription>
              We&apos;ll use these details to pre-fill sections in the block
              editor so you can launch faster.
            </DialogDescription>
          </DialogHeader>
          <form
            className="grid gap-6 md:grid-cols-[1.3fr,1fr]"
            onSubmit={(event) => {
              event.preventDefault();
              setIsGenerateOpen(false);
            }}
          >
            <div className="space-y-4">
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
            </div>
            <div className="space-y-3 rounded-lg border border-dashed border-border bg-muted/50 p-4 text-sm">
              <h3 className="text-sm font-semibold text-foreground">
                Preview snapshot
              </h3>
              <p className="text-xs uppercase text-muted-foreground">
                Business name
              </p>
              <p className="text-base font-medium text-foreground">
                {businessName || "Your business name"}
              </p>
              <p className="text-xs uppercase text-muted-foreground pt-2">
                What you do
              </p>
              <p className="text-sm text-foreground">
                {businessDescription ||
                  "Describe your offering to help us tailor copy."}
              </p>
              <p className="text-xs uppercase text-muted-foreground pt-2">
                Audience
              </p>
              <p className="text-sm text-foreground">
                {primaryAudience || "Who are you trying to reach?"}
              </p>
              <p className="text-xs uppercase text-muted-foreground pt-2">
                Call to action
              </p>
              <p className="text-sm text-foreground">
                {primaryGoal || "What do you want visitors to do first?"}
              </p>
            </div>
            <DialogFooter className="md:col-span-2">
              <Button
                type="button"
                variant="ghost"
                onClick={() => setIsGenerateOpen(false)}
              >
                Cancel
              </Button>
              <Button type="submit">Generate Template</Button>
            </DialogFooter>
          </form>
        </DialogContent>
      </Dialog>
    </div>
  );
}
