# SPEC — loomel

## Назначение

`loomel` создаёт и обновляет типизированные HTML- и SVG-элементы без JSX и
шаблонов. Единственная runtime-абстракция — `App<T>`: chainable-обёртка, которая
владеет одним нативным элементом и зарегистрированными подписками.

## Основные контракты

- `html()` создаёт элемент через `document.createElement` и применяет свойства.
- `svg()` создаёт элемент через `document.createElementNS` и применяет атрибуты.
- Изменяющие методы `App` возвращают тот же экземпляр.
- `app.node` оставляет прямой доступ к нативному DOM.
- HTML и SVG можно вкладывать друг в друга там, где это разрешает DOM.
- Типизированные входы не проверяются повторно в runtime.

## Публичные типы

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

## Фабрики

### `html(tag, config?)`

Возвращает `App<HTMLElementTagNameMap[Tag]>`. `props` применяются как
HTML-свойства. `style` и `dataset` мержатся, `textContent` приводится к строке.

```ts
const input = html('input', {
  props: { type: 'number', value: '5', className: 'amount' },
  on: { input: (event) => console.log(event.type) },
})
```

### `svg(tag, config?)`

Возвращает `App<SVGElementTagNameMap[Tag]>`. Props записываются через
`setAttribute`; для `style`, `dataset`, `textContent` и `className` действует
отдельная обработка.

```ts
const circle = svg('circle', {
  props: { cx: 12, cy: 12, r: 8, className: 'marker' },
})
```

## API App

### `node`

Нативный элемент, которым владеет `App`. Нужен для DOM-операций вне API.

```ts
document.body.append(panel.node)
panel.node.focus()
```

### `connected`

Возвращает, подключён ли элемент к document.

```ts
panel.connected // то же состояние, что и panel.node.isConnected
```

### `set(props)`

Обновляет HTML-свойства или SVG-атрибуты на месте и возвращает тот же `App`.
Отсутствующие поля не меняются. `set({ textContent })` остаётся доступен.

```ts
input.set({ value: '10', disabled: true })
circle.set({ r: 10, fill: 'tomato' })
title.set({ textContent: 'Обновлено' })
```

### `style(props)`

Мержит inline-стили и возвращает тот же `App`. Строки сохраняются. Числа
получают `px`, кроме нуля и unitless-свойств. CSS-переменные принимают строки.

```ts
panel.style({ width: 320, opacity: 0.8, '--gap': '1rem' })
```

### `text(value)`

Заменяет `textContent` на `String(value)` и возвращает тот же `App`. Нативное
поведение `textContent` удаляет детей, но подписки самого `App` сохраняются.

```ts
label.text('Готово')
counter.text(42)
```

### `data()`

Возвращает живой `DOMStringMap` элемента.

```ts
const dataset = panel.data()
```

### `data(key)`

Возвращает значение dataset или `undefined`. Ключ задаётся в camelCase-формате
dataset, а не как `data-kebab-case`.

```ts
const buildingId = panel.data('buildingId')
```

### `data(key, value)`

Устанавливает одно значение и возвращает тот же `App`. Числа и boolean
приводятся к строке; `null` удаляет ключ.

```ts
panel.data('buildingId', 42).data('ready', true)
panel.data('obsolete', null)
```

### `data(values)`

Устанавливает и удаляет несколько значений одним вызовом.

```ts
panel.data({ buildingId: 42, ready: true, obsolete: null })
```

### `append(...children)`

Добавляет подготовленных детей в конец и возвращает тот же `App`.

```ts
list.append(html('li').text('A'), 'хвост', 0)
```

### `prepend(...children)`

Добавляет подготовленных детей в начало и возвращает тот же `App`.

```ts
list.prepend(html('li').text('Первый'))
```

### `replace(...children)`

Заменяет всех детей через `replaceChildren` и возвращает тот же `App`.

```ts
list.replace(...items.map((item) => html('li').text(item)))
```

### `clear()`

Выполняет все функции отписки этого `App`, очищает их реестр, удаляет детей и
возвращает тот же `App`. Сам элемент остаётся в DOM.

```ts
panel.clear().append(html('p').text('Сброшено'))
```

### `on(type, handler, options?)`

Регистрирует типизированный DOM-listener, сохраняет его cleanup и возвращает
функцию отписки. Поддерживаются нативные boolean и `AddEventListenerOptions`.

```ts
const off = button.on('click', handleClick, { once: true })
off()
```

### `find(selector)`

Оборачивает первый подходящий HTML- или SVG-потомок. Если совпадений нет,
возвращает `null`. Найденный `App` применяет HTML-свойства или SVG-атрибуты в
зависимости от типа элемента.

```ts
panel.find('.status')?.style({ opacity: 1 }).text('Готово')
```

### `findAll(selector)`

Оборачивает все подходящие HTML- и SVG-потомки. Если совпадений нет, возвращает
пустой массив.

```ts
panel.findAll('[data-ready]').forEach((item) => item.data('seen', true))
```

### `dispose()`

Выполняет зарегистрированные функции отписки и удаляет элемент из дерева.
Повторное добавление `node` не восстанавливает listeners.

```ts
panel.dispose()
```

## Автоматическое наблюдение за lifecycle

### `watch(root)`

Наблюдает за удалёнными потомками document, элемента или shadow root. В конце
mutation batch снимает loomel-listeners с элементов, которые остались отключены.
Синхронно перемещённые элементы остаются активны. Возвращаемая функция отключает
observer, но не вызывает dispose для `App`.

```ts
const stop = watch(document.body)

container.replaceChildren()
stop()
```

## Дети

Значения `Child` рекурсивно разворачиваются. `App` превращается в `app.node`,
строки и числа — в текст, `null` и `false` пропускаются. Числовой ноль сохраняется.

```ts
const list = html('ul').append([
  items.map((item) => html('li').text(item)),
  condition && html('li').text('Дополнительно'),
])
```

## Границы lifecycle

- Отслеживаются только listeners, добавленные через `config.on` и `app.on()`.
- `clear()` и `dispose()` не вызывают рекурсивный dispose дочерних `App`.
- Обёртка из `find()` или `findAll()` владеет только подписками, добавленными через неё.
- Повторное добавление удалённого элемента не восстанавливает listeners.

## Вне области ответственности

- MathML.
- Парсинг и санитизация внешнего SVG.
- Шаблоны, JSX, virtual DOM и автоматический render.
- Автоматическое отслеживание lifecycle через `MutationObserver`.
