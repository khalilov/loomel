# loomel

Создание HTML и SVG без JSX и шаблонов. `html()` и `svg()` возвращают
компактную `App`-обёртку с цепочками обновлений. Всё как в лучших домах Парижа и Лондона: автокомплит на месте, DOM под рукой и
никаких навязанных фреймворков, танцев с компонентным API и JSX ради одного
несчастного `<div>`.

**2.1 kB gzipped** за всю ESM-сборку. В bundle analyzer придётся искать с лупой,
зато даже на херовом интернете загрузится раньше, чем ты успеешь моргнуть.

> 🤖 Вы coding agent? Сначала прочитайте [инструкцию для агентов](https://github.com/khalilov/loomel/blob/main/AGENTS.md).
> Нужны все нюансы? Откройте [полную спецификацию](https://github.com/khalilov/loomel/blob/main/SPEC-RU.md).

## Установка

```sh
npm install loomel
```

## Создание

```ts
import { html, watch } from 'loomel'

let value = 0

const counter = html('section', {
  props: { className: 'counter' },
  children: [
    html('strong', { props: { className: 'value' } }).text(value),
    html('button', {
      props: { type: 'button' },
      on: { click: () => counter.find('.value')?.text(++value) },
      children: ['Увеличить'],
    }),
  ],
})

document.body.append(counter.node)
watch(document.body)
```

HTML props типизированы по тегу. Дети принимают нативные элементы,
`App`, строки, числа, вложенные массивы, `null` и `false`.

## Обновление и цепочки

```ts
counter
  .set({ className: 'counter active', hidden: false })
  .style({ width: 240, opacity: 0.9 })
  .data('counterId', 42)
  .data({ ready: true, obsolete: null })

counter.find('.value')?.style({ color: 'tomato' }).text(value)
```

- `set()` обновляет HTML-свойства или SVG-атрибуты.
- `style()` мержит стили. Числа становятся `px`, кроме нуля и unitless-свойств.
- `text()` заменяет текст элемента.
- `data()` читает и обновляет `dataset`; `null` удаляет ключ.

```ts
counter.data() // живой DOMStringMap
counter.data('counterId') // "42"
counter.data('counterId', 43) // chainable setter
```

## Поиск потомков

```ts
const valueNode = counter.find('.value')
const buttons = counter.findAll('button')

valueNode?.text('Ready')
buttons.forEach((button) => button.data('ready', true))
```

`find()` возвращает `null`, если ничего не найдено, поэтому используйте optional chaining.
Оба метода оборачивают найденные HTML- и SVG-элементы в `App`. Нет совпадения —
нет драмы и `Cannot read properties of null`.

## SVG

```ts
import { svg } from 'loomel'

const icon = svg('svg', {
  props: { viewBox: '0 0 24 24', fill: 'none' },
  children: [
    svg('path', {
      props: { d: 'M12 2v20M2 12h20', stroke: 'currentColor', 'stroke-width': 2 },
    }),
  ],
})
```

`html()` пишет свойства, `svg()` — атрибуты через `setAttribute`.
Оба используют одинаковый chainable API `App`.

## События и lifecycle

```ts
const off = counter.on('click', handleClick, { passive: true })

counter.connected // true, пока элемент подключён к document
off() // снять этот listener
counter.clear() // снять listeners и очистить детей; оставить элемент
counter.dispose() // снять listeners и удалить элемент
```

`watch(root)` автоматически снимает loomel-listeners с удалённых чужим кодом
элементов и возвращает функцию остановки. Для прямой работы с DOM используйте
`app.node`.

## Разработка

```sh
npm test
npm run typecheck
npm run build
npm run pack:check
```
