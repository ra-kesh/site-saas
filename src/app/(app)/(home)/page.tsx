"use client";

import { FormEvent, useMemo, useState } from "react";
import { Menu } from "lucide-react";
import { useMutation, useQuery } from "@tanstack/react-query";
import { useRouter } from "next/navigation";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import {
  InputGroup,
  InputGroupAddon,
  InputGroupInput,
  InputGroupText,
} from "@/components/ui/input-group";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";
import { Spinner } from "@/components/ui/spinner";
import { Badge } from "@/components/ui/badge";
import { useTRPC } from "@/trpc/client";
import Link from "next/link";
import { Poppins } from "next/font/google";
import { cn } from "@/utilities/ui";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700"],
});

const navigation = [
  { name: "How it works", href: "#" },
  { name: "Features", href: "#" },
  { name: "Pricing", href: "#" },
  { name: "Testimonials", href: "#" },
];

const ROOT_DOMAIN = process.env.NEXT_PUBLIC_ROOT_DOMAIN ?? "ofpuri.com";

type AvailabilityResult =
  | {
      status: "available" | "unavailable" | "invalid";
      subdomain: string;
      fullDomain: string | null;
      message: string;
      suggestions: string[];
    }
  | {
      status: "error";
      subdomain: string;
      fullDomain: null;
      message: string;
      suggestions: string[];
    };

export default function Home() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [subdomain, setSubdomain] = useState("");
  const [lastResult, setLastResult] = useState<AvailabilityResult | null>(null);
  const [checkedValue, setCheckedValue] = useState("");

  const trpc = useTRPC();
  const router = useRouter();
  const sessionQuery = useQuery(trpc.auth.session.queryOptions());
  const isAuthenticated = Boolean(sessionQuery.data?.user);
  const ctaHref = isAuthenticated ? "/dashboard" : "/sign-up";
  const ctaLabel = isAuthenticated ? "Dashboard" : "Start building";

  const normalizedInput = useMemo(
    () => subdomain.trim().toLowerCase(),
    [subdomain]
  );

  const checkAvailability = useMutation(
    trpc.tenants.checkSiteAvailability.mutationOptions({
      onSuccess: (data) => {
        setLastResult(data);
        setCheckedValue(data.subdomain);
      },
      onError: (error, variables) => {
        const attempted = variables?.subdomain ?? normalizedInput;
        setLastResult({
          status: "error",
          subdomain: attempted,
          fullDomain: null,
          message: error.message || "Something went wrong. Try again shortly.",
          suggestions: [],
        });
        setCheckedValue(attempted);
      },
    })
  );

  const isResultStale = lastResult !== null && checkedValue !== normalizedInput;
  const activeResult =
    checkAvailability.isPending || !isResultStale ? lastResult : null;

  const buttonLabel = useMemo(() => {
    if (checkAvailability.isPending) {
      return "Checking availability...";
    }

    if (activeResult) {
      if (activeResult.status === "available") {
        return "Sign up to reserve this domain";
      }

      if (activeResult.status === "unavailable") {
        return "Try another name";
      }

      if (activeResult.status === "invalid") {
        return "Update the name to check again";
      }

      if (activeResult.status === "error") {
        return "Check availability again";
      }
    }

    if (!normalizedInput) {
      return "Reserve your free domain now";
    }

    return "Check availability";
  }, [activeResult, checkAvailability.isPending, normalizedInput]);

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (
      activeResult &&
      activeResult.status === "available" &&
      !isResultStale &&
      !checkAvailability.isPending
    ) {
      router.push(
        `/sign-up?sitename=${encodeURIComponent(activeResult.subdomain)}`
      );
      return;
    }

    const candidate = normalizedInput;
    if (!candidate) {
      setLastResult({
        status: "invalid",
        subdomain: "",
        fullDomain: null,
        message: "Enter a name to check if your free domain is available.",
        suggestions: [],
      });
      setCheckedValue("");
      return;
    }

    checkAvailability.mutate({ subdomain: candidate });
  };

  const handleSuggestionClick = (suggestion: string) => {
    setSubdomain(suggestion);
    checkAvailability.mutate({ subdomain: suggestion });
  };

  return (
    <div className="bg-background">
      <header className="absolute inset-x-0 top-0 z-50">
        <nav
          aria-label="Global"
          className="mx-auto flex max-w-7xl items-center justify-between p-6 lg:px-8"
        >
          <h1 className="flex lg:flex-1">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-primary text-primary-foreground">
                <span className="text-lg font-semibold">P</span>
              </div>
              <span
                className={cn(
                  "text-xl font-semibold text-foreground",
                  poppins.className
                )}
              >
                Sites of Puri
              </span>
            </Link>
          </h1>

          <div className="flex lg:hidden">
            <Sheet open={mobileMenuOpen} onOpenChange={setMobileMenuOpen}>
              <SheetTrigger asChild>
                <Button
                  variant="ghost"
                  size="icon"
                  className="-m-2.5 inline-flex items-center justify-center rounded-md p-2.5 text-gray-700"
                  aria-label="Open main menu"
                >
                  <Menu className="h-6 w-6" />
                </Button>
              </SheetTrigger>
              <SheetContent
                side="right"
                className="w-full overflow-y-auto sm:max-w-sm"
              >
                <SheetHeader className="px-6 pt-6 pb-4">
                  <SheetTitle className="sr-only">Navigation menu</SheetTitle>
                  <div className="flex items-center justify-between">
                    <Link
                      href="/"
                      className="text-xl font-bold text-primary"
                      onClick={() => setMobileMenuOpen(false)}
                    >
                      Sites of Puri
                    </Link>
                  </div>
                </SheetHeader>
                <div className="flow-root">
                  <div className="space-y-6">
                    <div className="px-6">
                      {navigation.map((item) => (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="block rounded-lg px-4 py-3 text-base/7 font-semibold text-foreground transition-colors hover:bg-accent hover:text-accent-foreground"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.name}
                        </Link>
                      ))}
                    </div>
                    <div className="border-t border-border px-6 pt-6 pb-8">
                      <Button
                        asChild
                        className="w-full justify-center rounded-lg px-4 py-2.5 text-base font-semibold"
                      >
                        <Link
                          href={ctaHref}
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {ctaLabel}
                          <span aria-hidden="true" className="ml-1">
                            &rarr;
                          </span>
                        </Link>
                      </Button>
                    </div>
                  </div>
                </div>
              </SheetContent>
            </Sheet>
          </div>
          <div className="hidden lg:flex lg:gap-x-12">
            {navigation.map((item) => (
              <a
                key={item.name}
                href={item.href}
                className="text-sm/6 font-semibold text-foreground transition-colors hover:text-primary"
              >
                {item.name}
              </a>
            ))}
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            <Button asChild className="text-sm/6 font-semibold">
              <Link href={ctaHref}>
                {ctaLabel}
                <span aria-hidden="true" className="ml-1">
                  &rarr;
                </span>
              </Link>
            </Button>
          </div>
        </nav>
      </header>
      <main>
        <div className="relative isolate">
          {/* <svg
            aria-hidden="true"
            className="absolute inset-x-0 top-0 -z-10 h-[64rem] w-full stroke-gray-200 [mask-image:radial-gradient(32rem_32rem_at_center,white,transparent)]"
          >
            <defs>
              <pattern
                x="50%"
                y={-1}
                id="1f932ae7-37de-4c0a-a8b0-a6e3b4d44b84"
                width={200}
                height={200}
                patternUnits="userSpaceOnUse"
              >
                <path d="M.5 200V.5H200" fill="none" />
              </pattern>
            </defs>
            <svg x="50%" y={-1} className="overflow-visible fill-gray-50">
              <path
                d="M-200 0h201v201h-201Z M600 0h201v201h-201Z M-400 600h201v201h-201Z M200 800h201v201h-201Z"
                strokeWidth={0}
              />
            </svg>
            <rect
              fill="url(#1f932ae7-37de-4c0a-a8b0-a6e3b4d44b84)"
              width="100%"
              height="100%"
              strokeWidth={0}
            />
          </svg> */}
          <div
            aria-hidden="true"
            className="absolute top-0 right-0 left-1/2 -z-10 -ml-24 transform-gpu overflow-hidden blur-3xl lg:ml-24 xl:ml-48"
          >
            <div
              style={{
                clipPath:
                  "polygon(63.1% 29.5%, 100% 17.1%, 76.6% 3%, 48.4% 0%, 44.6% 4.7%, 54.5% 25.3%, 59.8% 49%, 55.2% 57.8%, 44.4% 57.2%, 27.8% 47.9%, 35.1% 81.5%, 0% 97.7%, 39.2% 100%, 35.2% 81.4%, 97.2% 52.8%, 63.1% 29.5%)",
              }}
              className="aspect-801/1036 w-[50.0625rem] bg-linear-to-tr from-[#ff80b5] to-[#9089fc] opacity-30"
            />
          </div>
          <div className="overflow-hidden">
            <div className="mx-auto max-w-7xl px-6 pt-36 pb-32 sm:pt-60 lg:px-8 lg:pt-32">
              <div className="mx-auto max-w-2xl gap-x-14 lg:mx-0 lg:flex lg:max-w-none lg:items-center">
                <div className="relative w-full lg:max-w-xl lg:shrink-0 xl:max-w-2xl">
                  <h1 className="text-5xl font-semibold tracking-tight text-pretty text-gray-900 sm:text-7xl">
                    Build world class{" "}
                    <span className="relative whitespace-nowrap text-primary">
                      <svg
                        aria-hidden="true"
                        viewBox="0 0 418 42"
                        className="absolute top-2/3 left-0 h-[0.58em] w-full fill-blue-300/70"
                        preserveAspectRatio="none"
                      >
                        <path d="M203.371.916c-26.013-2.078-76.686 1.963-124.73 9.946L67.3 12.749C35.421 18.062 18.2 21.766 6.004 25.934 1.244 27.561.828 27.778.874 28.61c.07 1.214.828 1.121 9.595-1.176 9.072-2.377 17.15-3.92 39.246-7.496C123.565 7.986 157.869 4.492 195.942 5.046c7.461.108 19.25 1.696 19.17 2.582-.107 1.183-7.874 4.31-25.75 10.366-21.992 7.45-35.43 12.534-36.701 13.884-2.173 2.308-.202 4.407 4.442 4.734 2.654.187 3.263.157 15.593-.78 35.401-2.686 57.944-3.488 88.365-3.143 46.327.526 75.721 2.23 130.788 7.584 19.787 1.924 20.814 1.98 24.557 1.332l.066-.011c1.201-.203 1.53-1.825.399-2.335-2.911-1.31-4.893-1.604-22.048-3.261-57.509-5.556-87.871-7.36-132.059-7.842-23.239-.254-33.617-.116-50.627.674-11.629.54-42.371 2.494-46.696 2.967-2.359.259 8.133-3.625 26.504-9.81 23.239-7.825 27.934-10.149 28.304-14.005.417-4.348-3.529-6-16.878-7.066Z" />
                      </svg>
                      <span className="relative">websites</span>
                    </span>{" "}
                    in minutes
                  </h1>
                  <p className="mt-8 text-lg font-medium text-pretty text-gray-500 sm:max-w-md sm:text-xl/8 lg:max-w-none">
                    Creating a website for your business doesn’t need to be an
                    expensive process. With our website builder, You can
                    effortlessly launch your website within minutes for your
                    business. No coding experience needed.
                  </p>
                  <form
                    onSubmit={handleSubmit}
                    className="mt-10 flex w-full md:w-9/12 flex-col gap-y-4"
                  >
                    <div className="flex flex-col ">
                      <InputGroup className="h-10 flex-1">
                        <InputGroupAddon>
                          <InputGroupText>https://</InputGroupText>
                        </InputGroupAddon>
                        <InputGroupInput
                          value={subdomain}
                          onChange={(event) => {
                            const next = event.target.value
                              .toLowerCase()
                              .replace(/\s+/g, "-")
                              .replace(/[^a-z0-9-]/g, "")
                              .replace(/-+/g, "-")
                              .replace(/^-+/, "")
                              .replace(/-+$/, "");
                            setSubdomain(next);
                          }}
                          placeholder="sitename"
                          className="!pl-0.5"
                          aria-label="Desired site name"
                        />
                        <InputGroupAddon align="inline-end">
                          <InputGroupText>.{ROOT_DOMAIN}</InputGroupText>
                        </InputGroupAddon>
                      </InputGroup>
                      <p className="text-xs text-muted-foreground py-1">
                        Letters, numbers, and hyphens only.
                        {/* We’ll set you up at{" "}
                        <span className="font-medium text-foreground">
                          {domainPreview}
                        </span>
                        . */}
                      </p>
                      <Button
                        size="lg"
                        type="submit"
                        className="sm:w-auto mt-3 font-semibold text-base"
                        disabled={checkAvailability.isPending}
                      >
                        {checkAvailability.isPending ? (
                          <>
                            <Spinner className="mr-2" />
                            {buttonLabel}
                          </>
                        ) : (
                          buttonLabel
                        )}
                      </Button>
                    </div>

                    {(checkAvailability.isPending || activeResult) && (
                      <Alert
                        variant={
                          checkAvailability.isPending
                            ? "default"
                            : activeResult?.status === "available"
                              ? "default"
                              : "destructive"
                        }
                      >
                        {checkAvailability.isPending && (
                          <>
                            <Spinner className="mt-1" />
                            <AlertTitle>Checking availability...</AlertTitle>
                            <AlertDescription>
                              We&rsquo;ll confirm your free domain in just a
                              moment.
                            </AlertDescription>
                          </>
                        )}
                        {!checkAvailability.isPending && activeResult && (
                          <>
                            <AlertTitle>
                              {activeResult.status === "available"
                                ? `${activeResult.fullDomain} is available`
                                : activeResult.status === "error"
                                  ? "We hit a snag checking that name"
                                  : activeResult.status === "invalid"
                                    ? "Let's pick a name that works"
                                    : "That name isn’t available yet"}
                            </AlertTitle>
                            <AlertDescription>
                              <p>
                                {activeResult.status === "available" &&
                                !isResultStale &&
                                checkAvailability.status === "success"
                                  ? "Redirecting to the signup page…"
                                  : activeResult.message}
                              </p>
                              {activeResult.status === "available" &&
                                activeResult.fullDomain && (
                                  <p className="text-foreground">
                                    Create your account to claim{" "}
                                    <strong>{activeResult.fullDomain}</strong>.
                                  </p>
                                )}
                              {activeResult.suggestions.length > 0 && (
                                <div className="mt-2 flex flex-wrap items-center gap-2">
                                  <span className="text-xs uppercase tracking-wide text-muted-foreground">
                                    Try:
                                  </span>
                                  {activeResult.suggestions.map(
                                    (suggestion) => (
                                      <Badge
                                        key={suggestion}
                                        variant="outline"
                                        asChild
                                      >
                                        <button
                                          type="button"
                                          onClick={() =>
                                            handleSuggestionClick(suggestion)
                                          }
                                          className="whitespace-nowrap"
                                        >
                                          {suggestion}.{ROOT_DOMAIN}
                                        </button>
                                      </Badge>
                                    )
                                  )}
                                </div>
                              )}
                            </AlertDescription>
                          </>
                        )}
                      </Alert>
                    )}
                  </form>
                </div>
                <div className="mt-14 flex justify-end gap-8 sm:-mt-44 sm:justify-start sm:pl-20 lg:mt-0 lg:pl-0">
                  <div className="ml-auto w-44 flex-none space-y-8 pt-32 sm:ml-0 sm:pt-80 lg:order-last lg:pt-36 xl:order-none xl:pt-80">
                    <Card className="relative overflow-hidden border-0 shadow-lg py-0 rounded-md">
                      <CardContent className="p-0">
                        <img
                          alt=""
                          src="https://images.unsplash.com/photo-1557804506-669a67965ba0?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&h=528&q=80"
                          className="aspect-2/3 w-full object-cover"
                        />
                      </CardContent>
                    </Card>
                  </div>
                  <div className="mr-auto w-44 flex-none space-y-8 sm:mr-0 sm:pt-52 lg:pt-36">
                    <Card className="relative overflow-hidden border-0 shadow-lg py-0 rounded-md">
                      <CardContent className="p-0">
                        <img
                          alt=""
                          src="https://images.unsplash.com/photo-1485217988980-11786ced9454?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&h=528&q=80"
                          className="aspect-2/3 w-full object-cover"
                        />
                      </CardContent>
                    </Card>
                    <Card className="relative overflow-hidden border-0 shadow-lg py-0 rounded-md">
                      <CardContent className="p-0">
                        <img
                          alt=""
                          src="https://images.unsplash.com/photo-1559136555-9303baea8ebd?ixlib=rb-4.0.3&ixid=MnwxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&crop=focalpoint&fp-x=.4&w=396&h=528&q=80"
                          className="aspect-2/3 w-full object-cover"
                        />
                      </CardContent>
                    </Card>
                  </div>
                  <div className="w-44 flex-none space-y-8 pt-32 sm:pt-0">
                    <Card className="relative overflow-hidden border-0 shadow-lg py-0 rounded-md">
                      <CardContent className="p-0">
                        <img
                          alt=""
                          src="https://images.unsplash.com/photo-1670272504528-790c24957dda?ixlib=rb-4.0.3&ixid=MnwxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&crop=left&w=400&h=528&q=80"
                          className="aspect-2/3 w-full object-cover"
                        />
                      </CardContent>
                    </Card>
                    <Card className="relative overflow-hidden border-0 shadow-lg py-0 rounded-md">
                      <CardContent className="p-0">
                        <img
                          alt=""
                          src="https://images.unsplash.com/photo-1670272505284-8faba1c31f7d?ixlib=rb-4.0.3&ixid=MnwxMjA3fDF8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8&auto=format&fit=crop&h=528&q=80"
                          className="aspect-2/3 w-full object-cover"
                        />
                      </CardContent>
                    </Card>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </main>
    </div>
  );
}

function SwirlyDoodle(props: React.ComponentPropsWithoutRef<"svg">) {
  return (
    <svg
      aria-hidden="true"
      viewBox="0 0 281 40"
      preserveAspectRatio="none"
      {...props}
    >
      <path
        fillRule="evenodd"
        clipRule="evenodd"
        d="M240.172 22.994c-8.007 1.246-15.477 2.23-31.26 4.114-18.506 2.21-26.323 2.977-34.487 3.386-2.971.149-3.727.324-6.566 1.523-15.124 6.388-43.775 9.404-69.425 7.31-26.207-2.14-50.986-7.103-78-15.624C10.912 20.7.988 16.143.734 14.657c-.066-.381.043-.344 1.324.456 10.423 6.506 49.649 16.322 77.8 19.468 23.708 2.65 38.249 2.95 55.821 1.156 9.407-.962 24.451-3.773 25.101-4.692.074-.104.053-.155-.058-.135-1.062.195-13.863-.271-18.848-.687-16.681-1.389-28.722-4.345-38.142-9.364-15.294-8.15-7.298-19.232 14.802-20.514 16.095-.934 32.793 1.517 47.423 6.96 13.524 5.033 17.942 12.326 11.463 18.922l-.859.874.697-.006c2.681-.026 15.304-1.302 29.208-2.953 25.845-3.07 35.659-4.519 54.027-7.978 9.863-1.858 11.021-2.048 13.055-2.145a61.901 61.901 0 0 0 4.506-.417c1.891-.259 2.151-.267 1.543-.047-.402.145-2.33.913-4.285 1.707-4.635 1.882-5.202 2.07-8.736 2.903-3.414.805-19.773 3.797-26.404 4.829Zm40.321-9.93c.1-.066.231-.085.29-.041.059.043-.024.096-.183.119-.177.024-.219-.007-.107-.079ZM172.299 26.22c9.364-6.058 5.161-12.039-12.304-17.51-11.656-3.653-23.145-5.47-35.243-5.576-22.552-.198-33.577 7.462-21.321 14.814 12.012 7.205 32.994 10.557 61.531 9.831 4.563-.116 5.372-.288 7.337-1.559Z"
      />
    </svg>
  );
}
