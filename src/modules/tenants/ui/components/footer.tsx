import Link from "next/link";
import { Poppins } from "next/font/google";

import { cn } from "@/lib/utils";
import { CMSLink } from "@/components/Link";
import { getPayload } from "payload";
import configPromise from "@payload-config";

const poppins = Poppins({
  subsets: ["latin"],
  weight: ["700"],
});

interface TenantContextProps { tenantId?: string }

export const Footer = async (props?: TenantContextProps) => {
  const payload = await getPayload({ config: configPromise });
  let navItems: any[] = [];
  let hasFooterDoc = false;

  if (props?.tenantId) {
    const footerResult = await payload.find({
      collection: "footers",
      limit: 1,
      pagination: false,
      where: { tenant: { equals: props.tenantId } },
    });
    const footerDoc = (footerResult.docs?.[0] as any) ?? null;
    hasFooterDoc = Boolean(footerDoc);
    navItems = Array.isArray(footerDoc?.navItems) ? footerDoc.navItems : [];
  }

  if (!hasFooterDoc) return null;

  return (
    <footer className="border-t font-medium bg-white">
      <div className="max-w-(--breakpoint-xl) mx-auto flex items-center justify-between h-full gap-4 px-4 py-6 lg:px-12">
        <div className="flex items-center gap-2">
          <p>Powered by</p>
          <Link href={process.env.NEXT_PUBLIC_APP_URL!}>
            <span className={cn("text-2xl font-semibold", poppins.className)}>
              funroad
            </span>
          </Link>
        </div>
        <nav className="flex items-center gap-4">
          {navItems.map((item: any, i: number) => (
            <CMSLink key={i} {...item.link} appearance="link" />
          ))}
        </nav>
      </div>
    </footer>
  );
};
