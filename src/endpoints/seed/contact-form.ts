import type { RequiredDataFromCollectionSlug } from 'payload'

import {
  createHeadingNode,
  createParagraphNode,
  createRichText,
  createTextNode,
} from './richText'

type ContactFormArgs = {
  siteId: string
  siteSlug: string
  businessName: string
  businessDescription: string
  primaryAudience: string
  primaryGoal: string
  notificationEmail?: string | null
}

export const contactForm = ({
  siteId,
  siteSlug,
  businessName,
  businessDescription,
  primaryAudience,
  primaryGoal,
  notificationEmail,
}: ContactFormArgs): (RequiredDataFromCollectionSlug<'forms'> & { site: string }) => {
  const goalPhrase = primaryGoal.toLowerCase()

  return {
    site: siteId,
    title: `Contact ${businessName}`,
    submitButtonLabel: 'Send message',
    confirmationType: 'message',
    confirmationMessage: createRichText([
      createHeadingNode('h2', [
        createTextNode(
          `Thanks for reaching out to ${businessName} — we will reply within one business day.`,
        ),
      ]),
      createParagraphNode([
        createTextNode(
          `Let us know how we can help you ${goalPhrase} and we’ll tailor the next steps.`,
        ),
      ]),
    ]),
    emails: [
      {
        emailFrom: `"${businessName}" <no-reply@${siteSlug}.example.com>`,
        emailTo: '{{email}}',
        subject: `We received your message at ${businessName}`,
        message: createRichText([
          createParagraphNode([
            createTextNode(
              `Thanks for contacting ${businessName}. Our team will follow up shortly to talk about ${goalPhrase}.`,
            ),
          ]),
        ]),
      },
      ...(notificationEmail
        ? [
            {
              emailFrom: `"${businessName}" <no-reply@${siteSlug}.example.com>`,
              emailTo: notificationEmail,
              subject: 'New contact form submission',
              message: createRichText([
                createParagraphNode([
                  createTextNode(
                    `A new visitor just submitted the contact form. They’re interested in ${goalPhrase} — reply directly to their email to continue the conversation.`,
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
        defaultValue: businessDescription,
      },
      {
        blockType: 'textarea',
        label: 'Who are you trying to reach?',
        name: 'audience',
        required: false,
        width: 100,
        defaultValue: `We primarily serve ${primaryAudience}. Share more about your audience so we can tailor recommendations.`,
      },
      {
        blockType: 'textarea',
        label: 'Ideal next step',
        name: 'goal',
        required: false,
        width: 100,
        defaultValue: `Tell us what success looks like — for example, we can help you ${goalPhrase}.`,
      },
    ],
  }
}
