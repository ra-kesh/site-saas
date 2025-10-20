import type { RequiredDataFromCollectionSlug } from 'payload'

import {
  createHeadingNode,
  createParagraphNode,
  createRichText,
  createTextNode,
} from './richText'

type ContactFormArgs = {
  tenantId: string
  tenantName: string
  tenantSlug: string
  notificationEmail?: string | null
}

export const contactForm = ({
  tenantId,
  tenantName,
  tenantSlug,
  notificationEmail,
}: ContactFormArgs): (RequiredDataFromCollectionSlug<'forms'> & { tenant: string }) => ({
  tenant: tenantId,
  title: `Contact ${tenantName}`,
  submitButtonLabel: 'Send message',
  confirmationType: 'message',
  confirmationMessage: createRichText([
    createHeadingNode('h2', [
      createTextNode('Thanks for reaching out — we will reply within one business day.'),
    ]),
  ]),
  emails: [
    {
      emailFrom: `"${tenantName}" <no-reply@${tenantSlug}.example.com>`,
      emailTo: '{{email}}',
      subject: `We received your message at ${tenantName}`,
      message: createRichText([
        createParagraphNode([
          createTextNode(
            `Thanks for contacting ${tenantName}. A member of the team will follow up shortly.`,
          ),
        ]),
      ]),
    },
    ...(notificationEmail
      ? [
          {
            emailFrom: `"${tenantName}" <no-reply@${tenantSlug}.example.com>`,
            emailTo: notificationEmail,
            subject: 'New contact form submission',
            message: createRichText([
              createParagraphNode([
                createTextNode(
                  'A new visitor just submitted the contact form on your site. Reply directly to their email to continue the conversation.',
                ),
              ]),
            ]),
          },
        ]
      : []),
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
