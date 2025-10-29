import type { Payload } from "payload";

import type { Post } from "@/payload-types";

import { contactForm } from "./contact-form";
import { contactPage } from "./contact-page";
import { home } from "./home";
import { postsListingPage } from "./posts-page";
import { createPostSeeds } from "./posts";
import { generateSiteContentPath } from "@/lib/utils";

type SeedSiteArgs = {
  payload: Payload;
  site: {
    id: string;
    slug: string;
    name: string;
  };
  tenant?: {
    id: string;
    slug: string;
    name: string;
  } | null;
  ownerEmail?: string | null;
  businessDetails?: {
    name?: string | null;
    description?: string | null;
    audience?: string | null;
    primaryGoal?: string | null;
  };
};

const categoryNames = ["Product updates", "Customer spotlights"];

const toSlug = (input: string) =>
  input
    .trim()
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

export const seedSite = async ({
  payload,
  site,
  tenant,
  ownerEmail,
  businessDetails,
}: SeedSiteArgs) => {
  const { id: siteId, slug: siteSlug, name: siteName } = site;
  const tenantInfo = tenant ?? null;

  payload.logger.info(`Seeding starter content for site "${siteSlug}"…`);

  const displayName = businessDetails?.name?.trim() || siteName;
  const defaultDescription = `${displayName} delivers block-based marketing sites with reusable sections, live previews, and site-specific content tailored to each workspace.`;
  const description =
    businessDetails?.description?.trim() || defaultDescription;
  const audience =
    businessDetails?.audience?.trim() ||
    "growth-focused founders and marketing teams";
  const primaryGoal = businessDetails?.primaryGoal?.trim() || "Start a project";

  type SeedCollectionsWithSlug = "categories" | "pages" | "posts";

  const deleteBySlug = async (
    collection: SeedCollectionsWithSlug,
    slug: string
  ) => {
    const docs = await payload.find({
      collection,
      limit: 100,
      pagination: false,
      // overrideAccess: true,
      where: {
        and: [
          {
            slug: {
              equals: slug,
            },
          },
          {
            site: {
              equals: siteId,
            },
          },
        ],
      },
    });

    if (docs.totalDocs > 0) {
      await Promise.all(
        docs.docs.map((doc) =>
          payload.delete({
            collection,
            id: doc.id as string,
            // overrideAccess: true,
            context: {
              disableRevalidate: true,
            },
          })
        )
      );
    }
  };

  const deleteSeedForms = async () => {
    const existingForms = await payload.find({
      collection: "forms",
      limit: 100,
      pagination: false,
      overrideAccess: true,
      where: {
        site: {
          equals: siteId,
        },
      },
    });

    const formsToDelete = existingForms.docs.filter((form) => {
      if (!form.emails) return false;
      return form.emails.some((email) =>
        typeof email?.emailFrom === "string"
          ? email.emailFrom.includes(`${siteSlug}.example.com`)
          : false
      );
    });

    if (formsToDelete.length > 0) {
      await Promise.all(
        formsToDelete.map((form) =>
          payload.delete({
            collection: "forms",
            id: form.id as string,
            // overrideAccess: true,
            context: {
              disableRevalidate: true,
            },
          })
        )
      );
    }
  };

  await Promise.all([
    deleteBySlug("pages", "home"),
    deleteBySlug("pages", "contact"),
    deleteBySlug("pages", "posts"),
    deleteBySlug("posts", `introducing-${siteSlug}`),
    deleteBySlug("posts", `inside-${siteSlug}-build`),
    ...categoryNames.map((title) =>
      deleteBySlug("categories", `${toSlug(title)}-${siteSlug}`)
    ),
    deleteSeedForms(),
  ]);

  payload.logger.info("— Cleared previous seed content");

  const categories: Array<{ id: string; title: string }> = [];

  for (const title of categoryNames) {
    const category = await payload.create({
      collection: "categories",
      context: {
        disableRevalidate: true,
      },
      // overrideAccess: true,
      data: {
        site: siteId,
        title,
        slug: `${toSlug(title)}-${siteSlug}`,
      } as any,
    });
    const createdTitle =
      typeof (category as { title?: unknown }).title === "string"
        ? (category as { title: string }).title
        : title;
    categories.push({
      id: (category as { id: string | number }).id.toString(),
      title: createdTitle,
    });
  }

  payload.logger.info("— Seeded categories");

  const form = await payload.create({
    collection: "forms",
    context: {
      disableRevalidate: true,
    },
    overrideAccess: true,
    data: contactForm({
      siteId,
      siteSlug,
      businessName: displayName,
      businessDescription: description,
      primaryAudience: audience,
      primaryGoal,
      notificationEmail: ownerEmail ?? undefined,
    }),
  });

  payload.logger.info("— Added contact form");

  const homePageData = home({
    categories: categories.map(({ id }) => id as string),
    contactUrl: generateSiteContentPath({
      collection: "pages",
      slug: "contact",
      siteSlug,
      includeSitePrefix: true,
    }),
    featuredPostUrl: generateSiteContentPath({
      collection: "posts",
      slug: `introducing-${siteSlug}`,
      siteSlug,
      includeSitePrefix: true,
    }),
    siteId,
    siteSlug,
    businessName: displayName,
    businessDescription: description,
    primaryAudience: audience,
    primaryGoal,
  });

  const contactPageData = contactPage({
    contactFormId: form.id as string,
    siteId,
    businessName: displayName,
    businessDescription: description,
    primaryGoal,
  });

  const postsListingPageData = postsListingPage({
    categories: categories.map(({ id }) => id as string),
    siteId,
    siteName: displayName,
  });

  const pageSeeds = [homePageData, contactPageData, postsListingPageData];

  for (const seed of pageSeeds) {
    await payload.create({
      collection: "pages",
      context: {
        disableRevalidate: true,
      },
      // overrideAccess: true,
      data: seed,
    });
  }

  payload.logger.info("— Seeded starter pages");

  const postSeeds = createPostSeeds({
    categories: categories.map(({ id, title }) => ({ id, title })),
    siteId,
    siteSlug,
    businessName: displayName,
    businessDescription: description,
    primaryAudience: audience,
    primaryGoal,
  });

  const posts: Post[] = [];

  for (const postSeed of postSeeds) {
    const post = await payload.create({
      collection: "posts",
      context: {
        disableRevalidate: true,
      },
      // overrideAccess: true,
      data: postSeed,
    });
    posts.push(post as Post);
  }

  if (posts.length > 1) {
    const [firstPost, ...restPosts] = posts;

    if (firstPost && restPosts.length > 0) {
      await payload.update({
        collection: "posts",
        id: firstPost.id as string,
        context: {
          disableRevalidate: true,
        },
        overrideAccess: true,
        data: {
          relatedPosts: restPosts.map((post) => post.id),
        },
      });
    }
  }

  payload.logger.info("— Seeded starter posts");

  const siteHomePath = generateSiteContentPath({
    slug: "home",
    siteSlug,
    includeSitePrefix: true,
  });

  payload.logger.info(
    `Seeded database successfully for site "${siteSlug}". Visit ${siteHomePath} to review the draft.`
  );

  // if (site.status !== "active") {
  //   await payload.update({
  //     collection: "sites",
  //     id: siteId,
  //     data: {
  //       status: "active",
  //     },
  //     overrideAccess: true,
  //     context: {
  //       disableRevalidate: true,
  //     },
  //   });

  //   payload.logger.info(
  //     `Promoted site "${siteSlug}" to active status after seeding.`
  //   );
  // }
};
