export interface App<T extends Element = Element> {
  node: T
  set(props: SetProps<T>): App<T>
  append(...children: Child[]): App<T>
  prepend(...children: Child[]): App<T>
  replace(...children: Child[]): App<T>
  clear(): App<T>
  on<K extends keyof GlobalEventHandlersEventMap>(type: K, handler: (event: GlobalEventHandlersEventMap[K]) => void): () => void
  query(sel: string): Element | null
  queryAll(sel: string): NodeListOf<Element>
  find(sel: string): App<HTMLElement> | null
  dispose(): void
}

export type Child = Element | App<Element> | string | number | null | false | Child[]

export type SvgAttributeValue = string | number

export interface SvgAttributes {
  style?: Partial<CSSStyleDeclaration>
  dataset?: Record<string, string>
  [attr: string]: SvgAttributeValue | Partial<CSSStyleDeclaration> | Record<string, string> | undefined
}

export type SetProps<T extends Element> = T extends HTMLElement ? Partial<T> : SvgAttributes

export interface HtmlElementConfig<Tag extends keyof HTMLElementTagNameMap> {
  props?: Partial<HTMLElementTagNameMap[Tag]>
  on?: {
    [K in keyof GlobalEventHandlersEventMap]?: (event: GlobalEventHandlersEventMap[K]) => void
  }
  children?: Child | Child[]
}

export interface SvgElementConfig {
  props?: SvgAttributes
  on?: {
    [K in keyof GlobalEventHandlersEventMap]?: (event: GlobalEventHandlersEventMap[K]) => void
  }
  children?: Child | Child[]
}
