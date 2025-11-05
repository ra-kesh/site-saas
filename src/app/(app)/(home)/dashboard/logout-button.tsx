'use client';

import { useMutation, useQueryClient } from "@tanstack/react-query";
import { useRouter } from "next/navigation";
import { toast } from "sonner";

import { Button } from "@/components/ui/button";
import { useTRPC } from "@/trpc/client";

export const LogoutButton = () => {
  const trpc = useTRPC();
  const router = useRouter();
  const queryClient = useQueryClient();

  const logoutMutation = useMutation(
    trpc.auth.logout.mutationOptions({
      onSuccess: () => {
        queryClient.clear();
        router.replace("/sign-in");
        router.refresh();
        toast.success("Signed out");
      },
      onError: (error) => {
        toast.error(error.message || "Unable to sign out right now.");
      },
    }),
  );

  const handleLogout = () => {
    logoutMutation.mutate();
  };

  return (
    <Button
      variant="outline"
      size="sm"
      onClick={handleLogout}
      disabled={logoutMutation.isPending}
    >
      {logoutMutation.isPending ? "Signing out..." : "Log out"}
    </Button>
  );
};
