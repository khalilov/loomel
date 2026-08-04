# SPEC — Reactive HTML Element Factory

## Purpose

A minimal library for procedural generation and manipulation of HTML elements
without JSX or templates. The atom of the library is a **reactive node** (`App`):
a wrapper over a native `HTMLElement` that holds a reference to the element and
covers its lifecycle (creation, property updates, child composition, event
subscription, disposal).

## Motivation

The render code in `apps/app-client` accumulated repetitive patterns:

- Creating elements from an object config (`createElements`) returned a bare
  `HTMLElement` — updates and composition were left to the caller;
- Lists were redrawn via manual `querySelector` + `replaceChildren`
  (`DialogManager.setNotifications`);
- Template + `cloneNode` for repeated elements (`createCarriedResourcesPanel`).

The library covers these patterns with a single contract: create a node once,
then — `set` / `append` / `replace` / `on` / `dispose`.

## Key decisions

1. **One atom — `App<T>`.** Returns not a bare element but a node. The real
   element is always available as `app.node` — the integration point with native
   API and existing code (`document.body.append(el.node)`, passing to functions
   that expect `HTMLElement`).
2. **Strict typing by tag.** `create(tag, config)` returns
   `App<HTMLElementTagNameMap[Tag]>`; `props` — `Partial<HTMLElementTagNameMap[Tag]>`.
   Autocomplete and errors at the TS level, no runtime validation. Checks only at
   untyped boundaries (config comes from JSON/network).
3. **Properties applied via a shared `applyProps` helper.** Special cases
   (`className`, `style`, `dataset`) merge into sub-objects, the rest —
   `Reflect.set`. The same helper is used at creation time and in `set`.
4. **Children — flat list with bracket filtering.** `Child = HTMLElement | App |
   string | number | null | false`. `null`/`false` are convenient for conditional
   insertion and are filtered before insertion. Primitives convert to string
   (including `0` — filtered by value, not truthiness).
5. **Events — only via `on`.** Both layers: declarative `config.on` and the
   `app.on(type, handler)` method. The method returns an unsubscribe function.
   Subscriptions are collected for `dispose`.
6. **`dispose` — full teardown.** Removes all collected subscriptions and deletes
   the element from the tree. Re-use — re-attach subscriptions via `on` (one
   line). No hidden auto-lifecycle via `MutationObserver`.

## Public API

### Types (`types.ts`)

```ts
interface App<T extends HTMLElement = HTMLElement> {
  node: T
  set(props: Partial<T>): App<T>
  append(...children: Child[]): App<T>
  replace(...children: Child[]): App<T>
  on<K extends keyof HTMLElementEventMap>(type: K, handler: (event: HTMLElementEventMap[K]) => void): () => void
  dispose(): void
}

type Child = HTMLElement | App<HTMLElement> | string | number | null | false

interface ElementConfig<Tag extends keyof HTMLElementTagNameMap> {
  props?: Partial<HTMLElementTagNameMap[Tag]>
  on?: { [K in keyof HTMLElementEventMap]?: (event: HTMLElementEventMap[K]) => void }
  children?: Child | Child[]
}
```

### Factory (`create.ts`)

```ts
const create = <Tag extends keyof HTMLElementTagNameMap>(
  tag: Tag,
  config?: ElementConfig<Tag>,
): App<HTMLElementTagNameMap[Tag]>
```

### Helper (`apply.ts`)

```ts
const apply = <T extends HTMLElement>(element: T, props: Partial<T>): void
```

## `dispose` behavior (important)

`dispose()` = unsubscribe ALL collected subscriptions + `node.remove()`. Only
listeners attached via `on` / `config.on` enter the pool. If the node is
re-attached to the DOM via native `append`, subscriptions are **not** restored
automatically — they must be re-attached manually. This is a deliberate
compromise: no reactive layer tracking tree attachment.

## Out of scope

- **SVG** (`SVGElement`) is not handled — only `HTMLElement` and
  `HTMLElementEventMap`.
- **`applyProps` and own properties** — assigned via `Reflect.set`, but complex
  setter reads are not verified (e.g. `value` on `<input>`).
- Nested `Child[]` inside `Child[]` is not recursively flattened.

## v0.1 readiness

- [x] `create` with typed `props`/`on`/`children`
- [x] `set` / `append` / `replace` / `on` / `dispose`
- [x] `null`/`false` filtering without losing `0`
- [x] clean `tsc --noEmit` and `vitest` (5 tests)
