import type { RequiredDataFromCollectionSlug } from 'payload'

import { createHeadingNode, createParagraphNode, createRichText, createTextNode } from './richText'

type ContactFormArgs = {
  tenantId: string
}

export const contactForm = ({
  tenantId,
}: ContactFormArgs): (RequiredDataFromCollectionSlug<'forms'> & { tenant: string }) => ({
  tenant: tenantId,
  title: 'Contact Demo Creative',
  submitButtonLabel: 'Send message',
  confirmationType: 'message',
  confirmationMessage: createRichText([
    createHeadingNode('h2', [
      createTextNode('Thanks for reaching out — we will reply within one business day.'),
    ]),
  ]),
  emails: [
    {
      emailFrom: '"Demo Creative" <no-reply@democreative.test>',
      emailTo: '{{email}}',
      subject: 'We received your message',
      message: createRichText([
        createParagraphNode([
          createTextNode(
            'Thanks for contacting Demo Creative. A member of our team will follow up shortly.',
          ),
        ]),
      ]),
    },
  ],
  fields: [
    {
      blockType: 'text',
      label: 'Full name',
      name: 'fullName',
      required: true,
      width: 50,
    },
    {
      blockType: 'email',
      label: 'Work email',
      name: 'email',
      required: true,
      width: 50,
    },
    {
      blockType: 'textarea',
      label: 'Project details',
      name: 'projectDetails',
      required: true,
      width: 100,
    },
  ],
})

