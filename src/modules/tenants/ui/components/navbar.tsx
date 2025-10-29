import Link from "next/link";
import Image from "next/image";
import { ShoppingCartIcon } from "lucide-react";

import { generateTenantURL } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import type { Media, Tenant } from "@/payload-types";
import { getMediaUrl } from "@/utilities/getMediaUrl";

interface Props {
  tenant?: Tenant | null;
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

export const Navbar = ({ tenant }: Props) => {
  const tenantSlug = tenant?.slug ?? "";
  const tenantName = tenant?.name ?? (tenantSlug || "Your site");
  const tenantUrl = tenantSlug ? generateTenantURL(tenantSlug) : "#";
  const imageUrl = tenant ? getImageUrl(tenant.image) : null;

  return (
    <nav className="h-20 border-b font-medium bg-white">
      <div className="max-w-(--breakpoint-xl) mx-auto flex justify-between items-center h-full px-4 lg:px-12">
        <Link href={tenantUrl} className="flex items-center gap-2" prefetch={false}>
          {imageUrl && (
            <Image
              src={imageUrl}
              width={32}
              height={32}
              className="rounded-full border shrink-0 size-[32px]"
              alt={tenantSlug || tenantName}
            />
          )}
          <p className="text-xl">{tenantName}</p>
        </Link>
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
