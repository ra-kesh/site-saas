"use client";

import Link from "next/link";
import React, { useEffect, useState } from "react";
import type { Header as HeaderGlobal } from "@/payload-types";
import { useHeaderTheme } from "@/providers/HeaderTheme";
import { Logo } from "@/components/Logo/Logo";
import { CMSLink } from "@/components/Link";

type Props = {
  data: HeaderGlobal;
  homeHref: string;
  searchHref?: string;
};

export const TenantHeaderClient: React.FC<Props> = ({ data, homeHref, searchHref }) => {
  const [theme, setTheme] = useState<string | null>(null);
  const { headerTheme, setHeaderTheme } = useHeaderTheme();

  useEffect(() => {
    setHeaderTheme(null);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    if (headerTheme && headerTheme !== theme) setTheme(headerTheme);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [headerTheme]);

  const navItems = Array.isArray(data?.navItems) ? data.navItems : [];

  return (
    <header className="container relative z-20" {...(theme ? { "data-theme": theme } : {})}>
      <div className="py-8 flex justify-between items-center">
        <Link href={homeHref} aria-label="Home">
          <Logo loading="eager" priority="high" className="invert dark:invert-0" />
        </Link>
        <nav className="flex gap-3 items-center">
          {navItems.map(({ link }, i: number) => (
            <CMSLink key={i} {...link} appearance="link" />
          ))}
          {searchHref ? (
            <Link href={searchHref} aria-label="Search" className="text-primary">
              {/* icon intentionally omitted for now */}
              Search
            </Link>
          ) : null}
        </nav>
      </div>
    </header>
  );
};
