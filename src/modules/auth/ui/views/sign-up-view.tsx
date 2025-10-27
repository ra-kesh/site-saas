"use client";

import z from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { Poppins } from "next/font/google";
import { useForm } from "react-hook-form";
import { useRouter, useSearchParams } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { cn, generateTenantURL } from "@/lib/utils";
import { useTRPC } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormDescription,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { registerSchema } from "../../schemas";
import { AuthAside } from "@/modules/auth/ui/components/auth-aside";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700"],
});

const sanitizeSitename = (value: string) =>
  value
    .toLowerCase()
    .replace(/\s+/g, "-")
    .replace(/[^a-z0-9-]/g, "")
    .replace(/-+/g, "-")
    .replace(/^-+/, "")
    .replace(/-+$/, "");

export const SignUpView = () => {
  const router = useRouter();
  const searchParams = useSearchParams();
  const initialSitename = sanitizeSitename(searchParams.get("sitename") ?? "");

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();

  const register = useMutation(
    trpc.auth.register.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.auth.session.queryFilter());
        router.push("/");
      },
    })
  );

  const form = useForm<z.infer<typeof registerSchema>>({
    mode: "all",
    resolver: zodResolver(registerSchema),
    defaultValues: {
      email: "",
      password: "",
      sitename: initialSitename,
    },
  });

  const onSubmit = (values: z.infer<typeof registerSchema>) => {
    register.mutate(values);
  };

  const sitename = form.watch("sitename");
  const sitenameErrors = form.formState.errors.sitename;
  const showPreview = sitename && !sitenameErrors;

  return (
    <div className="grid min-h-screen lg:grid-cols-2">
      <div className="flex flex-col justify-between bg-background">
        <header className="flex items-center justify-between px-6 py-6 sm:px-12">
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
          <Button
            asChild
            variant="secondary"
            size="sm"
            className="text-base text-primary hover:text-primary"
          >
            <Link prefetch href="/sign-in">
              Sign in
            </Link>
          </Button>
        </header>

        <div className="mx-auto flex w-full  flex-1 flex-col justify-center px-6 pb-16 pt-8  sm:pt-16 lg:pb-24 max-w-md sm:px-4 md:w-96 md:max-w-sm md:px-0">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold text-foreground">
              Create your account
            </h1>
            <p className="text-muted-foreground">
              Reserve your free domain and spin up your website in minutes.
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="mt-8 space-y-6"
            >
              <FormField
                name="sitename"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Sitename
                    </FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormDescription
                      className={cn("hidden text-xs", showPreview && "block")}
                    >
                      Your website will be available at{" "}
                      {showPreview && (
                        <strong>{generateTenantURL(sitename)}</strong>
                      )}
                    </FormDescription>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="email"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">Email</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <FormField
                name="password"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel className="text-sm font-medium">
                      Password
                    </FormLabel>
                    <FormControl>
                      <Input {...field} type="password" />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />
              <Button
                disabled={register.isPending}
                type="submit"
                size="lg"
                className="w-full"
              >
                {register.isPending ? "Creating account..." : "Create account"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Already have an account?{" "}
                <Link
                  className="font-medium text-primary hover:text-primary/80"
                  href="/sign-in"
                >
                  Sign in
                </Link>
              </p>
            </form>
          </Form>
        </div>

        <footer className="flex items-center justify-between px-6 py-6 text-sm text-muted-foreground sm:px-12">
          <span>&copy; {currentYear} Sites of Puri. All rights reserved.</span>
          <Button
            size="sm"
            variant="ghost"
            className="h-auto p-0 text-muted-foreground hover:text-foreground"
          >
            English
          </Button>
        </footer>
      </div>

      <AuthAside />
    </div>
  );
};
