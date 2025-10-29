import React, { Fragment } from "react";

import type { Page, Site, Tenant } from "@/payload-types";
import type { SiteReference, TenantReference } from "@/lib/utils";

import { ArchiveBlock } from "@/blocks/ArchiveBlock/Component";
import { CallToActionBlock } from "@/blocks/CallToAction/Component";
import { ContentBlock } from "@/blocks/Content/Component";
import { FormBlock } from "@/blocks/Form/Component";
import { MediaBlock } from "@/blocks/MediaBlock/Component";

const blockComponents = {
  archive: ArchiveBlock,
  content: ContentBlock,
  cta: CallToActionBlock,
  formBlock: FormBlock,
  mediaBlock: MediaBlock,
}

export const RenderBlocks: React.FC<{
  blocks: Page["layout"][0][];
  site?: Site | SiteReference | null;
  tenant?: Tenant | TenantReference;
}> = (props) => {
  const { blocks, site, tenant } = props;

  const hasBlocks = blocks && Array.isArray(blocks) && blocks.length > 0;

  if (hasBlocks) {
    return (
      <Fragment>
        {blocks.map((block, index) => {
          const { blockType } = block;

          if (blockType && blockType in blockComponents) {
            const BlockComponent = blockComponents[blockType] as React.FC<Record<string, unknown>>;

            if (BlockComponent) {
              return (
                <div className="my-16" key={index}>
                  <BlockComponent
                    {...block}
                    disableInnerContainer
                    site={site}
                    tenant={tenant}
                  />
                </div>
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
