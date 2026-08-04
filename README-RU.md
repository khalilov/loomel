# loomel

Реактивная фабрика HTML-элементов: процедурное создание и манипулирование DOM без
JSX и шаблонов. Один атом — `App`, обёртка над нативным `HTMLElement`.

## Установка

```
bun add loomel
```

## Быстрый старт

```ts
import { create } from 'loomel'

const meter = create('div', {
  props: { className: 'world-inspector-need' },
  children: [
    create('span', { props: { textContent: 'Голод' } }),
    create('span', {
      props: { className: 'need-fill', style: { width: '42%' } },
    }),
  ],
})

document.body.append(meter.node)
```

## Публичный API

| Член                         | Назначение                                                           |
| ---------------------------- | -------------------------------------------------------------------- |
| `create(tag, config?)`       | Создаёт реактивный узел `App<HTMLElementTagNameMap[Tag]>`            |
| `app.node`                   | Настоящий `HTMLElement` — точка интеграции с нативным API            |
| `app.set(props)`             | Обновляет свойства на месте                                          |
| `app.append(...children)`    | Добавляет детей в конец                                         |
| `app.prepend(...children)`   | Добавляет детей в начало                                        |
| `app.replace(...children)`   | Заменяет содержимое (`replaceChildren`)                         |
| `app.clear()`                | Снимает подписки и очищает детей; узел остаётся в DOM               |
| `app.on(type, handler)`      | Подписка на событие; возвращает функцию отписки                      |
| `app.query(sel)`             | Шорткат к `querySelector` — возвращает `Element | null`              |
| `app.queryAll(sel)`          | Шорткат к `querySelectorAll` — возвращает `NodeListOf<Element>`      |
| `app.dispose()`              | Снимает все подписки и удаляет элемент из дерева                     |
| `applyProps(element, props)` | Нижний хелпер применения свойств                                     |

## Конфиг создания

```ts
interface ElementConfig<Tag extends keyof HTMLElementTagNameMap> {
  props?: Partial<HTMLElementTagNameMap[Tag]> // типизировано по тегу
  on?: { [K in keyof HTMLElementEventMap]?: (e: HTMLElementEventMap[K]) => void }
  children?: Child | Child[]
}
```

`props` строго типизирован: для `create('button', ...)` автокомплит и проверки идут
по `HTMLButtonElement`. Частные случаи (`style`, `dataset`) мержатся в под-объекты.

## Дети

`Child = HTMLElement | App<HTMLElement> | string | number | null | false`

- `App` разрешается в свой `.node`, примитив — в текст (`0` не теряется);
- `null` / `false` удобны для условной вставки и отсекаются автоматически.

```ts
const panel = create('div', {
  children: [
    maybeTitle && create('h2', { props: { textContent: maybeTitle } }),
    create('ul', { children: items.map((item) => create('li', { props: { textContent: item } })) }),
  ],
})
```

## Жизненный цикл

```ts
const list = create('ul')

// где-то по мере прихода данных — перерисовать содержимое
const redraw = (items: string[]) =>
  list.replace(...items.map((item) => create('li', { props: { textContent: item } })))

redraw(['a', 'b'])
redraw(['c'])

list.clear() // подписки сняты, дети очищены, узел в DOM остаётся
list.dispose() // подписки сняты, узел удалён из DOM
```

> `dispose()` удаляет элемент и снимает подписки. Если узел затем вернуть в DOM
> нативным `append`, подписки навешиваются заново вручную — авто-восстановления нет.

> `clear()` снимает подписки и очищает детей, но оставляет узел в дереве.
> Удобно для сброса компонента без его уничтожения.

## Пример: реактивный счётчик

```ts
import { create } from 'loomel'

const buildCounter = (initial: number) => {
  const display = create('span', { props: { textContent: String(initial) } })

  const button = create('button', {
    props: { textContent: '+"' } },
    on: { click: () => display.add },
  })

  return create('div', { children: [display, button, create('input')] })
}
```

## Тесты

```
bun test
```
