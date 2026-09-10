export interface App<T extends Element = Element> {
  node: T
  set(props: SetProps<T>): App<T>
  style(props: StyleProps): App<T>
  text(value: string | number): App<T>
  append(...children: Child[]): App<T>
  prepend(...children: Child[]): App<T>
  replace(...children: Child[]): App<T>
  clear(): App<T>
  on<K extends keyof GlobalEventHandlersEventMap>(
    type: K,
    handler: (event: GlobalEventHandlersEventMap[K]) => void,
    options?: boolean | AddEventListenerOptions,
  ): () => void
  query(sel: string): Element | null
  queryAll(sel: string): NodeListOf<Element>
  find(sel: string): App<HTMLElement> | App<SVGElement> | null
  findAll(sel: string): Array<App<HTMLElement> | App<SVGElement>>
  dispose(): void
}

export type Child = Element | App<Element> | string | number | null | false | Child[]

export type SvgAttributeValue = string | number

export type StyleProps = Partial<{
  [K in keyof CSSStyleDeclaration as CSSStyleDeclaration[K] extends string ? K : never]: string | number
}> &
  Partial<Record<`--${string}`, string>>

export interface SvgAttributes {
  style?: StyleProps
  dataset?: Record<string, string>
  [attr: string]: SvgAttributeValue | StyleProps | Record<string, string> | undefined
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
