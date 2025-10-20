import type { DefaultTypedEditorState } from '@payloadcms/richtext-lexical'

type LexicalNode = Record<string, unknown>

type HeadingTag = 'h1' | 'h2' | 'h3' | 'h4'

export const createTextNode = (text: string): LexicalNode =>
  ({
    detail: 0,
    format: 0,
    mode: 'normal',
    style: '',
    text,
    type: 'text',
    version: 1,
  }) as LexicalNode

export const createParagraphNode = (children: LexicalNode[]): LexicalNode =>
  ({
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    textFormat: 0,
    type: 'paragraph',
    version: 1,
  }) as LexicalNode

export const createHeadingNode = (tag: HeadingTag, children: LexicalNode[]): LexicalNode =>
  ({
    children,
    direction: 'ltr',
    format: '',
    indent: 0,
    tag,
    type: 'heading',
    version: 1,
  }) as LexicalNode

type CustomLinkOptions = {
  newTab?: boolean
  url: string
}

export const createCustomLinkNode = (
  children: LexicalNode[],
  { newTab = false, url }: CustomLinkOptions,
): LexicalNode =>
  ({
    children,
    direction: 'ltr',
    fields: {
      linkType: 'custom',
      newTab,
      url,
    },
    format: '',
    indent: 0,
    type: 'link',
    version: 1,
  }) as LexicalNode

export const createRichText = (children: LexicalNode[]): DefaultTypedEditorState =>
  ({
    root: {
      children,
      direction: 'ltr',
      format: '',
      indent: 0,
      type: 'root',
      version: 1,
    },
  }) as DefaultTypedEditorState

