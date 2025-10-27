"use client";

import { FormEvent, useMemo, useState } from "react";
import { Menu } from "lucide-react";
import { useMutation } from "@tanstack/react-query";

import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import {
  Sheet,
  SheetContent,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@/components/ui/sheet";
import { Separator } from "@/components/ui/separator";
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

const navigation = [
  { name: "Product", href: "#" },
  { name: "Features", href: "#" },
  { name: "Marketplace", href: "#" },
  { name: "Company", href: "#" },
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

export default function Example() {
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [subdomain, setSubdomain] = useState("");
  const [lastResult, setLastResult] = useState<AvailabilityResult | null>(null);
  const [checkedValue, setCheckedValue] = useState("");

  const trpc = useTRPC();

  const normalizedInput = useMemo(
    () => subdomain.trim().toLowerCase(),
    [subdomain]
  );

  const domainPreview = useMemo(() => {
    if (!normalizedInput) {
      return `yourname.${ROOT_DOMAIN}`;
    }

    const sanitized = normalizedInput.replace(/[^a-z0-9-]/g, "-");
    const compact = sanitized.replace(/-+/g, "-").replace(/^-|-$/g, "");

    return compact ? `${compact}.${ROOT_DOMAIN}` : `yourname.${ROOT_DOMAIN}`;
  }, [normalizedInput]);

  const checkAvailability = useMutation(
    trpc.tenants.checkAvailability.mutationOptions({
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

  const handleSubmit = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault();

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
          <div className="flex lg:flex-1">
            <a href="#" className="-m-1.5 p-1.5">
              <h1 className="text-xl font-bold text-primary">Sites of Puri</h1>
            </a>
          </div>
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
                <SheetHeader>
                  <SheetTitle className="sr-only">Navigation menu</SheetTitle>
                  <div className="flex items-center justify-between">
                    <a href="#" className="-m-1.5 p-1.5">
                      <h1 className="text-xl font-bold text-primary">
                        Sites of Puri
                      </h1>
                    </a>
                  </div>
                </SheetHeader>
                <div className="mt-6 flow-root">
                  <div className="-my-6 divide-y divide-border">
                    <div className="space-y-2 py-6">
                      {navigation.map((item) => (
                        <a
                          key={item.name}
                          href={item.href}
                          className="-mx-3 block rounded-lg px-3 py-2 text-base/7 font-semibold text-foreground hover:bg-accent hover:text-accent-foreground"
                          onClick={() => setMobileMenuOpen(false)}
                        >
                          {item.name}
                        </a>
                      ))}
                    </div>
                    <Separator />
                    <div className="py-6">
                      <a
                        href="#"
                        className="-mx-3 block rounded-lg px-3 py-2.5 text-base/7 font-semibold text-foreground hover:bg-accent hover:text-accent-foreground"
                        onClick={() => setMobileMenuOpen(false)}
                      >
                        Log in
                      </a>
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
                className="text-sm/6 font-semibold text-foreground hover:text-primary transition-colors"
              >
                {item.name}
              </a>
            ))}
          </div>
          <div className="hidden lg:flex lg:flex-1 lg:justify-end">
            <Button variant="ghost" asChild>
              <a href="#" className="text-sm/6 font-semibold">
                Log in <span aria-hidden="true">&rarr;</span>
              </a>
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
                    Build world class website in minutes
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
                        className="sm:w-auto mt-3"
                        disabled={checkAvailability.isPending}
                      >
                        {checkAvailability.isPending ? (
                          <>
                            <Spinner className="mr-2" />
                            Checking...
                          </>
                        ) : (
                          "Reserve your free domain now"
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
                              <p>{activeResult.message}</p>
                              {activeResult.status === "available" &&
                                activeResult.fullDomain && (
                                  <p className="text-foreground">
                                    Reserve it now to launch{" "}
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
