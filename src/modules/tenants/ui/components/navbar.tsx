import Link from "next/link";
import Image from "next/image";
import { ShoppingCartIcon } from "lucide-react";

import { generateTenantURL } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Media, Tenant } from "@/payload-types";
import { getMediaUrl } from "@/utilities/getMediaUrl";
import { CMSLink } from "@/components/Link";
import { getPayload } from "payload";
import configPromise from "@payload-config";
import { unstable_cache } from "next/cache";

interface Props {
  tenant: Tenant;
}

const getImageUrl = (image: Tenant["image"]) => {
  if (!image) return null;

  if (typeof image === "object") {
    const media = image as Media;
    const baseUrl =
      media.url ??
      media.thumbnailURL ??
      media.sizes?.thumbnail?.url ??
      media.sizes?.square?.url ??
      null;

    if (!baseUrl) {
      return null;
    }

    return getMediaUrl(baseUrl, media.updatedAt);
  }

  return null;
};

export const Navbar = async ({ tenant }: Props) => {
  const tenantUrl = generateTenantURL(tenant.slug);
  const imageUrl = getImageUrl(tenant.image);
  const payload = await getPayload({ config: configPromise });
  const settings = await unstable_cache(
    async () => {
      const res = await payload.find({
        collection: "settings" as any,
        limit: 1,
        pagination: false,
        where: { tenant: { equals: tenant.id } },
      });
      return (res.docs?.[0] as any) ?? null;
    },
    ["tenant-settings", String(tenant.id)],
    { tags: ["settings", `tenant:${tenant.slug}`] }
  )();
  const logoFromSettings = settings?.brand?.logoLight ?? null;
  const logoUrl = getImageUrl(logoFromSettings || tenant.image);
  const headerDoc = await unstable_cache(
    async () => {
      const res = await payload.find({
        collection: "headers",
        limit: 1,
        pagination: false,
        where: { tenant: { equals: tenant.id } },
      });
      return (res.docs?.[0] as any) ?? null;
    },
    ["tenant-header", String(tenant.id)],
    { tags: ["headers", `tenant:${tenant.slug}`] }
  )();
  const navItems = Array.isArray(headerDoc?.navItems) ? headerDoc.navItems : [];

  if (!headerDoc) return null;

  return (
    <nav className="h-20 border-b font-medium bg-white relative z-50" aria-label="Primary">
      <div className="max-w-(--breakpoint-xl) mx-auto flex justify-between items-center h-full px-4 lg:px-12">
        <Link href={tenantUrl} className="flex items-center gap-2">
          {logoUrl && (
            <Image
              src={logoUrl}
              width={32}
              height={32}
              className="rounded-full border shrink-0 size-[32px]"
              alt={tenant.slug}
            />
          )}
          <p className="text-xl">{tenant.name}</p>
        </Link>
        <div className="flex items-center gap-4">
          {navItems.map((item: any, i: number) => (
            <CMSLink key={i} {...item.link} appearance="link" />
          ))}
        </div>
      </div>
    </nav>
  );
};

export const NavbarSkeleton = () => {
  return (
    <nav className="h-20 border-b font-medium bg-white">
      <div className="max-w-(--breakpoint-xl) mx-auto flex justify-between items-center h-full px-4 lg:px-12">
        <div />
        <Button disabled className="bg-white">
          <ShoppingCartIcon className="text-black" />
        </Button>
      </div>
    </nav>
  );
};
