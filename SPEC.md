# SPEC — Reactive HTML/SVG Element Factory

## Purpose

A minimal library for procedural generation and manipulation of HTML and SVG
elements without JSX or templates. The atom of the library is a **reactive node**
(`App`): a wrapper over a native `Element` that holds a reference to the element
and covers its lifecycle (creation, property/attribute updates, child
composition, event subscription, disposal).

## Motivation

The render code in `apps/app-client` accumulated repetitive patterns:

- Creating elements from an object config (`createElements`) returned a bare
  `HTMLElement` — updates and composition were left to the caller;
- Lists were redrawn via manual `querySelector` + `replaceChildren`
  (`DialogManager.setNotifications`);
- Template + `cloneNode` for repeated elements (`createCarriedResourcesPanel`).

The library covers these patterns with a single contract: create a node once,
then — `set` / `append` / `replace` / `clear` / `on` / `query` / `dispose`.

## Key decisions

1. **One atom — `App<T>`.** Returns not a bare element but a node. The real
   element is always available as `app.node` — the integration point with native
   API and existing code (`document.body.append(el.node)`, passing to functions
   that expect `HTMLElement`).
2. **Strict typing by tag.** `html(tag, config)` returns
   `App<HTMLElementTagNameMap[Tag]>`; `svg(tag, config)` returns
   `App<SVGElementTagNameMap[Tag]>`. HTML `props` — `Partial<HTMLElementTagNameMap[Tag]>`;
   SVG `props` — `SvgAttributes` (attribute names as `string | number`).
   Autocomplete and errors at the TS level, no runtime validation. Checks only at
   untyped boundaries (config comes from JSON/network).
3. **Two namespaces, one `App`.** HTML applies *properties* via a shared
   `apply` helper (`Reflect.set`, special cases `className`, `style`, `dataset`,
   `textContent`). SVG applies *attributes* via `applySvg` (`setAttribute`,
   special cases `style`, `dataset`, `textContent`, `className` → `class`).
   Presentation attributes (`d`, `viewBox`, `fill`) are not reflected as
   properties, so they must go through `setAttribute`. The same helper is used at
   creation time and in `set`.
4. **Children — flat list with bracket filtering.** `Child = Element | App |
   string | number | null | false | Child[]`. `null`/`false` are convenient for
   conditional insertion and are filtered before insertion. Primitives convert to
   string (including `0` — filtered by value, not truthiness). Nested `Child[]`
   are recursively flattened. HTML and SVG can be nested into each other where
   the DOM allows it.
5. **Events — only via `on`.** Both layers: declarative `config.on` and the
   `app.on(type, handler)` method. The method returns an unsubscribe function.
   Subscriptions are collected for `dispose`.
6. **`dispose` — full teardown.** Removes all collected subscriptions and deletes
   the element from the tree. Re-use — re-attach subscriptions via `on` (one
   line). No hidden auto-lifecycle via `MutationObserver`.
7. **`clear` — soft reset.** Drops subscriptions and clears children but keeps
   the node in the DOM. Complements `dispose` for component reset scenarios.
8. **`query` / `queryAll` — DOM search shorthands.** Thin wrappers over
   `querySelector` / `querySelectorAll` scoped to the node.

## Public API

### Types (`types.ts`)

```ts
interface App<T extends Element = Element> {
  node: T
  set(props: SetProps<T>): App<T>
  append(...children: Child[]): App<T>
  prepend(...children: Child[]): App<T>
  replace(...children: Child[]): App<T>
  clear(): App<T>
  on<K extends keyof GlobalEventHandlersEventMap>(type: K, handler: (event: GlobalEventHandlersEventMap[K]) => void): () => void
  query(sel: string): Element | null
  queryAll(sel: string): NodeListOf<Element>
  dispose(): void
}

type Child = Element | App<Element> | string | number | null | false | Child[]

type SetProps<T extends Element> = T extends HTMLElement ? Partial<T> : SvgAttributes

interface SvgAttributes {
  style?: Partial<CSSStyleDeclaration>
  dataset?: Record<string, string>
  [attr: string]: string | number | Partial<CSSStyleDeclaration> | Record<string, string> | undefined
}

interface HtmlElementConfig<Tag extends keyof HTMLElementTagNameMap> {
  props?: Partial<HTMLElementTagNameMap[Tag]>
  on?: { [K in keyof GlobalEventHandlersEventMap]?: (event: GlobalEventHandlersEventMap[K]) => void }
  children?: Child | Child[]
}

interface SvgElementConfig {
  props?: SvgAttributes
  on?: { [K in keyof GlobalEventHandlersEventMap]?: (event: GlobalEventHandlersEventMap[K]) => void }
  children?: Child | Child[]
}
```

### Factories (`html.ts`, `svg.ts`)

```ts
const html = <Tag extends keyof HTMLElementTagNameMap>(
  tag: Tag,
  config?: HtmlElementConfig<Tag>,
): App<HTMLElementTagNameMap[Tag]>

const svg = <Tag extends keyof SVGElementTagNameMap>(
  tag: Tag,
  config?: SvgElementConfig,
): App<SVGElementTagNameMap[Tag]>
```

`html` uses `document.createElement`; `svg` uses
`document.createElementNS('http://www.w3.org/2000/svg', tag)`.

`create` is a deprecated alias of `html` and will be removed in the next major.

### Helpers (`apply.ts`, `applySvg.ts`)

```ts
const apply = <T extends HTMLElement>(element: T, props: Partial<T>): void
const applySvg = <T extends SVGElement>(element: T, props: SvgAttributes): void
```

## `dispose` and `clear` behavior (important)

`dispose()` = unsubscribe ALL collected subscriptions + `node.remove()`. Only
listeners attached via `on` / `config.on` enter the pool. If the node is
re-attached to the DOM via native `append`, subscriptions are **not** restored
automatically — they must be re-attached manually. This is a deliberate
compromise: no reactive layer tracking tree attachment.

`clear()` = unsubscribe ALL collected subscriptions + `node.replaceChildren()`.
The node stays in the DOM. Useful for resetting a component without destroying
it — re-attach subscriptions via `on` after clearing.

## Out of scope

- **MathML** (`MathMLElement`) is not handled — only `HTMLElement`/`SVGElement` and
  `GlobalEventHandlersEventMap`.
- **`apply` and own properties** — assigned via `Reflect.set`, but complex
  setter reads are not verified (e.g. `value` on `<input>`).
- Parsing SVG strings, loading SVG files, sanitizing external SVG, an icon
  registry, JSX and templating.
- Nested `Child[]` inside `Child[]` is now recursively flattened.

## v0.1 readiness

- [x] `html`/`svg` with typed `props`/`on`/`children`
- [x] `set` / `append` / `prepend` / `replace` / `clear` / `on` / `query` / `queryAll` / `dispose`
- [x] SVG attributes via `setAttribute`, `className` → `class`
- [x] `null`/`false` filtering without losing `0`
- [x] clean `tsc --noEmit` and `vitest`
