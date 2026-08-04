export interface App<T extends HTMLElement = HTMLElement> {
  node: T
  set(props: Partial<T>): App<T>
  append(...children: Child[]): App<T>
  prepend(...children: Child[]): App<T>
  replace(...children: Child[]): App<T>
  clear(): App<T>
  on<K extends keyof HTMLElementEventMap>(type: K, handler: (event: HTMLElementEventMap[K]) => void): () => void
  query(sel: string): Element | null
  queryAll(sel: string): NodeListOf<Element>
  dispose(): void
}

export type Child = HTMLElement | App<HTMLElement> | string | number | null | false | Child[]

export interface ElementConfig<Tag extends keyof HTMLElementTagNameMap> {
  props?: Partial<HTMLElementTagNameMap[Tag]>
  on?: {
    [K in keyof HTMLElementEventMap]?: (event: HTMLElementEventMap[K]) => void
  }
  children?: Child | Child[]
}
