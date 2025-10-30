import React from "react";
import { cn } from "@/utilities/ui";

type Variant = "default" | "muted" | "primary" | "dark";
type Padding = "none" | "sm" | "md" | "lg" | "xl";

const variantClasses: Record<Variant, string> = {
  default: "bg-transparent",
  muted: "bg-muted/40",
  primary: "bg-primary/5",
  dark: "bg-black text-white",
};

const padY: Record<Padding, string> = {
  none: "py-0",
  sm: "py-8",
  md: "py-12",
  lg: "py-16",
  xl: "py-24",
};

export function Section({
  id,
  children,
  className,
  container = true,
  variant = "default",
  padding = "lg",
}: {
  id?: string;
  children: React.ReactNode;
  className?: string;
  container?: boolean;
  variant?: Variant;
  padding?: Padding;
}) {
  return (
    <section id={id} className={cn(variantClasses[variant], padY[padding])}>
      {container ? (
        <div className={cn("container", className)}>{children}</div>
      ) : (
        <>{children}</>
      )}
    </section>
  );
}
