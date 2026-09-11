# SPEC — loomel

## Purpose

`loomel` creates and updates typed HTML and SVG elements without JSX or
templates. Its single runtime abstraction is `App<T>`, a chainable wrapper that
owns one native element and its registered event subscriptions.

## Core contracts

- `html()` creates an element with `document.createElement` and applies properties.
- `svg()` creates an element with `document.createElementNS` and applies attributes.
- Mutating `App` methods return the same instance.
- `app.node` is the escape hatch for native DOM operations.
- HTML and SVG may be nested wherever the DOM permits it.
- Runtime validation is limited to untyped boundaries; TypeScript owns typed input.

## Public types

```ts
interface App<T extends Element = Element> {
  node: T
  readonly connected: boolean
  set(props: SetProps<T>): App<T>
  style(props: StyleProps): App<T>
  text(value: string | number): App<T>
  data(): DOMStringMap
  data(key: string): string | undefined
  data(key: string, value: DataValue): App<T>
  data(values: Record<string, DataValue>): App<T>
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

type Child = Element | App<Element> | string | number | null | false | Child[]
type DataValue = string | number | boolean | null
type SetProps<T extends Element> = T extends HTMLElement ? Partial<T> : SvgAttributes

type StyleProps = Partial<{
  [K in keyof CSSStyleDeclaration as CSSStyleDeclaration[K] extends string ? K : never]: string | number
}> & Partial<Record<`--${string}`, string>>

interface SvgAttributes {
  style?: StyleProps
  dataset?: Record<string, string>
  [attr: string]: string | number | StyleProps | Record<string, string> | undefined
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

## Factories

### `html(tag, config?)`

Returns `App<HTMLElementTagNameMap[Tag]>`. `props` are assigned as HTML
properties. `style` and `dataset` are merged; `textContent` is stringified.

```ts
const input = html('input', {
  props: { type: 'number', value: '5', className: 'amount' },
  on: { input: (event) => console.log(event.type) },
})
```

### `svg(tag, config?)`

Returns `App<SVGElementTagNameMap[Tag]>`. Props are written with
`setAttribute`; `style`, `dataset`, `textContent`, and `className` have dedicated
handling.

```ts
const circle = svg('circle', {
  props: { cx: 12, cy: 12, r: 8, className: 'marker' },
})
```

## App API

### `node`

The owned native element. Use it for DOM operations outside `App`.

```ts
document.body.append(panel.node)
panel.node.focus()
```

### `connected`

Returns whether the owned element is connected to a document.

```ts
panel.connected // same state as panel.node.isConnected
```

### `set(props)`

Updates HTML properties or SVG attributes in place and returns the same `App`.
Omitted fields are untouched. `set({ textContent })` remains supported.

```ts
input.set({ value: '10', disabled: true })
circle.set({ r: 10, fill: 'tomato' })
title.set({ textContent: 'Updated' })
```

### `style(props)`

Merges inline styles and returns the same `App`. Strings are preserved. Numeric
values receive `px`, except zero and unitless properties. CSS custom properties
accept strings.

```ts
panel.style({ width: 320, opacity: 0.8, '--gap': '1rem' })
```

### `text(value)`

Replaces `textContent` with `String(value)` and returns the same `App`. Existing
children are removed by native `textContent` behavior; subscriptions on the
`App` itself remain registered.

```ts
label.text('Ready')
counter.text(42)
```

### `data()`

Returns the element's live `DOMStringMap`.

```ts
const dataset = panel.data()
```

### `data(key)`

Returns a dataset value or `undefined`. Keys use dataset camelCase, not
`data-kebab-case`.

```ts
const buildingId = panel.data('buildingId')
```

### `data(key, value)`

Sets one dataset value and returns the same `App`. Numbers and booleans are
stringified; `null` deletes the key.

```ts
panel.data('buildingId', 42).data('ready', true)
panel.data('obsolete', null)
```

### `data(values)`

Sets and deletes multiple dataset values in one call.

```ts
panel.data({ buildingId: 42, ready: true, obsolete: null })
```

### `append(...children)`

Appends resolved children and returns the same `App`.

```ts
list.append(html('li').text('A'), 'tail', 0)
```

### `prepend(...children)`

Prepends resolved children and returns the same `App`.

```ts
list.prepend(html('li').text('First'))
```

### `replace(...children)`

Replaces all children through `replaceChildren` and returns the same `App`.

```ts
list.replace(...items.map((item) => html('li').text(item)))
```

### `clear()`

Runs every unsubscribe callback registered by this `App`, clears that registry,
removes all children, and returns the same `App`. The owned element stays in the
DOM.

```ts
panel.clear().append(html('p').text('Reset'))
```

### `on(type, handler, options?)`

Registers a typed DOM listener, stores its cleanup callback, and returns that
callback. Native boolean and `AddEventListenerOptions` forms are supported.

```ts
const off = button.on('click', handleClick, { once: true })
off()
```

### `find(selector)`

Wraps the first matching HTML or SVG descendant. Returns `null` when no element
matches. The returned `App` uses HTML property or SVG attribute behavior based
on the matched element.

```ts
panel.find('.status')?.style({ opacity: 1 }).text('Ready')
```

### `findAll(selector)`

Wraps every matching HTML and SVG descendant. Returns an empty array when there
are no matches.

```ts
panel.findAll('[data-ready]').forEach((item) => item.data('seen', true))
```

### `dispose()`

Runs registered unsubscribe callbacks and removes the owned element from its
tree. Reattaching `node` does not restore listeners.

```ts
panel.dispose()
```

## Automatic lifecycle observation

### `watch(root)`

Observes removed descendants of a document, element, or shadow root. At the end
of each mutation batch, loomel listeners are removed from elements that remain
disconnected. Synchronously reparented elements remain active. The returned
function stops observation without disposing apps.

```ts
const stop = watch(document.body)

container.replaceChildren()
stop()
```

## Children

`Child` values are recursively flattened. `App` resolves to `app.node`, strings
and numbers become text, and `null`/`false` are skipped. Numeric zero is kept.

```ts
const list = html('ul').append([
  items.map((item) => html('li').text(item)),
  condition && html('li').text('Extra'),
])
```

## Lifecycle boundaries

- Only listeners registered through `config.on` or `app.on()` are tracked.
- `clear()` and `dispose()` do not recursively dispose child `App` wrappers.
- A wrapper returned by `find()` or `findAll()` owns only subscriptions added
  through that wrapper.
- Reattaching a disposed element does not recreate listeners.

## Out of scope

- MathML.
- Parsing or sanitizing external SVG.
- Templates, JSX, virtual DOM, and automatic rendering.
- Automatic lifecycle tracking through `MutationObserver`.
