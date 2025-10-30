import React, { Fragment } from "react";

import type { Page, Tenant } from "@/payload-types";
import type { TenantReference } from "@/lib/utils";

import { ArchiveBlock } from "@/blocks/ArchiveBlock/Component";
import { CallToActionBlock } from "@/blocks/CallToAction/Component";
import { ContentBlock } from "@/blocks/Content/Component";
import { FormBlock } from "@/blocks/Form/Component";
import { MediaBlock } from "@/blocks/MediaBlock/Component";
import { Section } from "@/components/Section";
import { LogosBlock } from "@/blocks/Logos/Component";
import { StatsBlock } from "@/blocks/Stats/Component";
import { PricingBlock } from "@/blocks/Pricing/Component";
import { TestimonialsBlock } from "@/blocks/Testimonials/Component";
import { FAQBlock } from "@/blocks/FAQ/Component";

const blockComponents = {
  archive: ArchiveBlock,
  content: ContentBlock,
  cta: CallToActionBlock,
  formBlock: FormBlock,
  mediaBlock: MediaBlock,
  logos: LogosBlock,
  stats: StatsBlock,
  pricing: PricingBlock,
  testimonials: TestimonialsBlock,
  faq: FAQBlock,
}

export const RenderBlocks: React.FC<{
  blocks: Page["layout"][0][];
  tenant?: Tenant | TenantReference;
}> = (props) => {
  const { blocks, tenant } = props;

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0;

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockType } = block;

          if (blockType && blockType in blockComponents) {
            const Block = blockComponents[blockType];

            if (Block) {
              const variant =
                blockType === "cta"
                  ? "muted"
                  : blockType === "formBlock"
                  ? "default"
                  : "default";

              return (
                <Section key={index} variant={variant} padding="lg" container={false}>
                  {/* @ts-expect-error there may be some mismatch between the expected types here */}
                  <Block {...block} disableInnerContainer tenant={tenant} />
                </Section>
              );
            }
          }
          return null;
        })}
      </Fragment>
    );
  }

  return null;
};
