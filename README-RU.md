# loomel

Реактивная фабрика HTML/SVG-элементов: процедурное создание и манипулирование DOM
без JSX и шаблонов. Один атом — `App`, обёртка над нативным `Element`.

## Установка

```
bun add loomel
```

## Быстрый старт

```ts
import { html } from 'loomel'

const meter = html('div', {
  props: { className: 'world-inspector-need' },
  children: [
    html('span', { props: { textContent: 'Голод' } }),
    html('span', {
      props: { className: 'need-fill', style: { width: '42%' } },
    }),
  ],
})

document.body.append(meter.node)
```

## SVG

`svg()` создаёт элементы в SVG-namespace и применяет атрибуты через `setAttribute`,
а не через присваивание свойств. Атрибуты `viewBox`, `d`, `fill`, `stroke`,
`stroke-width` и любые другие передаются прямо в `props`.

```ts
import { html, svg } from 'loomel'

const icon = html('span', {
  children: [
    svg('svg', {
      props: { viewBox: '0 0 24 24', fill: 'none' },
      children: [
        svg('path', {
          props: {
            d: 'M12 2v20M2 12h20',
            stroke: 'currentColor',
            'stroke-width': 2,
          },
        }),
      ],
    }),
  ],
})
```

## HTML properties против SVG attributes

- **`html()`** присваивает *свойства* (`Reflect.set`), с частными случаями
  `className`, `style`, `dataset`, `textContent` — так, как HTML-элементы
  отражают своё состояние.
- **`svg()`** пишет *атрибуты* (`setAttribute`). SVG presentation-атрибуты
  (`d`, `viewBox`, `fill`) не отражаются в свойства элемента, поэтому идут через
  `setAttribute`. `style` и `dataset` по-прежнему мержатся в под-объекты,
  `className` мапится на атрибут `class`.

Оба namespace делят общий API `App`: `set`, `append`, `prepend`, `replace`,
`clear`, `on`, `query`, `queryAll`, `dispose`.

## Публичный API

| Член                         | Назначение                                                      |
| ---------------------------- | --------------------------------------------------------------- |
| `html(tag, config?)`         | Создаёт реактивный узел `App<HTMLElementTagNameMap[Tag]>`       |
| `svg(tag, config?)`          | Создаёт реактивный узел `App<SVGElementTagNameMap[Tag]>`        |
| `app.node`                   | Настоящий `Element` — точка интеграции с нативным API           |
| `app.set(props)`             | Обновляет свойства (HTML) / атрибуты (SVG) на месте             |
| `app.append(...children)`    | Добавляет детей в конец                                         |
| `app.prepend(...children)`   | Добавляет детей в начало                                        |
| `app.replace(...children)`   | Заменяет содержимое (`replaceChildren`)                         |
| `app.clear()`                | Снимает подписки и очищает детей; узел остаётся в DOM           |
| `app.on(type, handler)`      | Подписка на событие; возвращает функцию отписки                 |
| `app.query(sel)`             | Шорткат к `querySelector` — возвращает `Element | null`         |
| `app.queryAll(sel)`          | Шорткат к `querySelectorAll` — возвращает `NodeListOf<Element>` |
| `app.dispose()`              | Снимает все подписки и удаляет элемент из дерева                |
| `applyProps(element, props)` | Нижний хелпер применения свойств                                |

> **Deprecated:** `create()` — алиас `html()`. Используйте `html()`. `create()`
> будет удалён в следующей major-версии.

## Конфиг создания

```ts
interface HtmlElementConfig<Tag extends keyof HTMLElementTagNameMap> {
  props?: Partial<HTMLElementTagNameMap[Tag]> // типизировано по тегу
  on?: { [K in keyof GlobalEventHandlersEventMap]?: (e: GlobalEventHandlersEventMap[K]) => void }
  children?: Child | Child[]
}

interface SvgElementConfig {
  props?: SvgAttributes // атрибуты: string | number, плюс style / dataset
  on?: { [K in keyof GlobalEventHandlersEventMap]?: (e: GlobalEventHandlersEventMap[K]) => void }
  children?: Child | Child[]
}
```

HTML `props` строго типизирован: для `html('button', ...)` автокомплит и проверки
идут по `HTMLButtonElement`. Частные случаи (`style`, `dataset`) мержатся в
под-объекты. SVG `props` принимает произвольные имена атрибутов как `string |
number`.

## Дети

`Child = Element | App<Element> | string | number | null | false | Child[]`

- `App` разрешается в свой `.node`, примитив — в текст (`0` не теряется);
- `null` / `false` удобны для условной вставки и отсекаются автоматически;
- вложенные `Child[]` разворачиваются рекурсивно.

HTML и SVG можно вкладывать друг в друга там, где это разрешено DOM.

```ts
const panel = html('div', {
  children: [
    maybeTitle && html('h2', { props: { textContent: maybeTitle } }),
    html('ul', { children: items.map((item) => html('li', { props: { textContent: item } })) }),
  ],
})
```

## Жизненный цикл

```ts
const list = html('ul')

// где-то по мере прихода данных — перерисовать содержимое
const redraw = (items: string[]) =>
  list.replace(...items.map((item) => html('li', { props: { textContent: item } })))

redraw(['a', 'b'])
redraw(['c'])

list.clear() // подписки сняты, дети очищены, узел в DOM остаётся
list.dispose() // подписки сняты, узел удалён из DOM
```

> `dispose()` удаляет элемент и снимает подписки. Если узел затем вернуть в DOM
> нативным `append`, подписки навешиваются заново вручную — авто-восстановления нет.

> `clear()` снимает подписки и очищает детей, но оставляет узел в дереве.
> Удобно для сброса компонента без его уничтожения.

## Пример: вложенные обработчики событий

```ts
import { html } from 'loomel'

const items = ['яблоко', 'банан', 'вишня']

const list = html('ul', {
  children: items.map((item) =>
    html('li', {
      props: { textContent: item },
      on: { click: () => console.log(`clicked: ${item}`) },
    }),
  ),
})

document.body.append(list.node)

// dispose снимает все вложенные подписки и удаляет элемент из DOM
list.dispose()
```

## Пример: реактивный счётчик

```ts
import { html } from 'loomel'

const buildCounter = (initial: number) => {
  const display = html('span', { props: { textContent: String(initial) } })

  const button = html('button', {
    props: { textContent: '+' },
    on: { click: () => display.set({ textContent: String(++count) }) },
  })

  let count = initial
  return html('div', { children: [display, button] })
}
```

## Тесты

```
bun test
```
