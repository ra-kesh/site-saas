export type SiteTemplateId = "convention" | "mobile-shop";

export interface SiteTemplateMeta {
  id: SiteTemplateId;
  name: string;
  headline: string;
  description: string;
  previewImage: string;
  recommendedFor: string[];
}

export const SITE_TEMPLATES: SiteTemplateMeta[] = [
  {
    id: "convention",
    name: "Convention",
    headline: "Own the stage for your next convention",
    description:
      "Purpose-built for conferences or conventions with a hero agenda, speaker highlights, and registration callouts.",
    previewImage: "/templates/convention-preview.jpg",
    recommendedFor: ["Conferences", "Meetups", "Summits"],
  },
  {
    id: "mobile-shop",
    name: "Mobile Shop",
    headline: "Showcase products and accept bookings on the go",
    description:
      "Highlight your catalog, capture inquiries, and publish location-aware callouts for mobile retailers.",
    previewImage: "/templates/mobile-shop-preview.jpg",
    recommendedFor: ["Food trucks", "Pop-up stores", "Mobile vendors"],
  },
];

const templateIds = new Set(SITE_TEMPLATES.map((template) => template.id));

export const isSiteTemplateId = (value: string): value is SiteTemplateId => {
  return templateIds.has(value as SiteTemplateId);
};

export const getSiteTemplateById = (
  value: SiteTemplateId
): SiteTemplateMeta => {
  const template = SITE_TEMPLATES.find((item) => item.id === value);

  if (!template) {
    throw new Error(`Unknown site template id: ${value}`);
  }

  return template;
};
