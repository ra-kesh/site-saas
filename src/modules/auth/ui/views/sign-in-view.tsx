"use client";

import z from "zod";
import Link from "next/link";
import { toast } from "sonner";
import { Poppins } from "next/font/google";
import { useForm } from "react-hook-form";
import { useRouter } from "next/navigation";
import { zodResolver } from "@hookform/resolvers/zod";
import { useMutation, useQueryClient } from "@tanstack/react-query";

import { useTRPC } from "@/trpc/client";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";

import { loginSchema } from "../../schemas";
import { AuthAside } from "@/modules/auth/ui/components/auth-aside";
import { cn } from "@/lib/utils";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700"],
});

export const SignInView = () => {
  const router = useRouter();

  const trpc = useTRPC();
  const queryClient = useQueryClient();
  const currentYear = new Date().getFullYear();

  const login = useMutation(
    trpc.auth.login.mutationOptions({
      onError: (error) => {
        toast.error(error.message);
      },
      onSuccess: async () => {
        await queryClient.invalidateQueries(trpc.auth.session.queryFilter());
        router.push("/dashboard");
      },
    })
  );

  const form = useForm<z.infer<typeof loginSchema>>({
    mode: "all",
    resolver: zodResolver(loginSchema),
    defaultValues: {
      email: "",
      password: "",
    },
  });

  const onSubmit = (values: z.infer<typeof loginSchema>) => {
    login.mutate(values);
  };

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
            variant="ghost"
            size="sm"
            className="text-base text-primary hover:text-primary"
          >
            <Link prefetch href="/sign-up">
              Sign up
            </Link>
          </Button>
        </header>

        <div className="mx-auto flex w-full  flex-1 flex-col justify-center px-6 pb-16 pt-8  sm:pt-16 lg:pb-24 max-w-md sm:px-4 md:w-96 md:max-w-sm md:px-0">
          <div className="space-y-2 text-center">
            <h1 className="text-3xl font-semibold text-foreground">
              Welcome back
            </h1>
            <p className="text-muted-foreground">
              Enter your credentials to access your dashboard.
            </p>
          </div>

          <Form {...form}>
            <form
              onSubmit={form.handleSubmit(onSubmit)}
              className="mt-8 space-y-6"
            >
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
                disabled={login.isPending}
                type="submit"
                size="lg"
                className="w-full"
              >
                {login.isPending ? "Signing in..." : "Sign in"}
              </Button>
              <p className="text-center text-sm text-muted-foreground">
                Don&apos;t have an account?{" "}
                <Link
                  className="font-medium text-primary hover:text-primary/80"
                  href="/sign-up"
                >
                  Create one
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
