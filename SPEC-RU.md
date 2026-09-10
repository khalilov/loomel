# SPEC — реактивная фабрика HTML/SVG-элементов

## Назначение

Супер-мини библиотека для процедурной генерации и последующего манипулирования
HTML- и SVG-элементами без JSX и шаблонов. Атом библиотеки — **реактивный узел**
(`App`): обёртка над нативным `Element`, которая держит ссылку на элемент и закрывает
его жизненный цикл (создание, обновление свойств/атрибутов, компоновка детей,
подписка на события, удаление).

## Мотивация

В рендер-коде проекта `apps/app-client` накопились повторяющиеся паттерны:

- создание элемента из объектного конфига (`createElements`) отдавало голый
  `HTMLElement` — обновление и компоновка оставались на вызвавшем коде;
- списки перерисовывались через ручные `querySelector` + `replaceChildren`
  (`DialogManager.setNotifications`);
- шаблон + `cloneNode` для повторяющихся элементов (`createCarriedResourcesPanel`).

Библиотека закрывает эти паттерны одним контрактом: создал узел один раз, дальше —
`set` / `style` / `text` / `append` / `replace` / `clear` / `on` / `find` / `dispose`.

## Ключевые решения

1. **Один атом — `App<T>`.** Возвращается не голый элемент, а узел. Настоящий элемент
   всегда доступен как `app.node` — это точка интеграции с нативным API и существующим
   кодом (`document.body.append(el.node)`, передача в функции, ждущие `HTMLElement`).
2. **Cтрогая типизация по тегу.** `html(tag, config)` возвращает
   `App<HTMLElementTagNameMap[Tag]>`; `svg(tag, config)` — `App<SVGElementTagNameMap[Tag]>`.
   HTML `props` — `Partial<HTMLElementTagNameMap[Tag]>`; SVG `props` — `SvgAttributes`
   (имена атрибутов как `string | number`). Автокомплит и ошибки на уровне TS, без
   runtime-валидации. Проверки только на непечатанных границах (конфиг приходит из
   JSON/сети).
3. **Два namespace, один `App`.** HTML применяет *свойства* общим хелпером `apply`
   (`Reflect.set`, частные случаи `className`, `style`, `dataset`, `textContent`).
   SVG применяет *атрибуты* через `applySvg` (`setAttribute`, частные случаи `style`,
   `dataset`, `textContent`, `className` → `class`). Presentation-атрибуты (`d`,
   `viewBox`, `fill`) не отражаются в свойства, поэтому идут через `setAttribute`.
   Один и тот же хелпер используется и при создании, и в `set`.
4. **Дети — плоский список с отбросом скобок.** `Child = Element | App |
   string | number | null | false | Child[]`. `null`/`false` удобны для условной
   вставки и отсекаются до вставки. Примитивы конвертируются в строку (в т.ч.
   `0` не теряется — отсев по значению, не по truthiness). Вложенные `Child[]`
   разворачиваются рекурсивно. HTML и SVG вкладываются друг в друга там, где это
   разрешено DOM.
5. **События — только через `on`.** Оба слоя: декларативный `config.on` и метод
   `app.on(type, handler, options?)`. Нативные options listener поддержаны. Метод возвращает
   функцию отписки. Подписки собираются для
   `dispose`.
6. **`dispose` — полная ликвидация.** Снимает все собранные подписки и удаляет элемент
   из дерева. Повторное использование — навесить подписки заново через `on` (одна
   строка). Никакого скрытого авто-жизненного цикла через `MutationObserver`.
7. **`clear` — мягкий сброс.** Снимает подписки и очищает детей, но оставляет узел
   в DOM. Дополняет `dispose` для сценариев сброса компонента.
8. **`query` / `queryAll` — шорткаты DOM-поиска.** Обёртки над `querySelector` /
   `querySelectorAll`, скоупнутые на узел.
9. **`find` / `findAll` — DOM-поиск с обёрткой.** Найденные HTML- и SVG-элементы
   возвращаются как `App` с корректным поведением namespace.

## Публичный API

### Типы (`types.ts`)

```ts
interface App<T extends Element = Element> {
  node: T
  set(props: SetProps<T>): App<T>
  style(props: StyleProps): App<T>
  text(value: string | number): App<T>
  append(...children: Child[]): App<T>
  prepend(...children: Child[]): App<T>
  replace(...children: Child[]): App<T>
  clear(): App<T>
  on<K extends keyof GlobalEventHandlersEventMap>(type: K, handler: (event: GlobalEventHandlersEventMap[K]) => void, options?: boolean | AddEventListenerOptions): () => void
  query(sel: string): Element | null
  queryAll(sel: string): NodeListOf<Element>
  find(sel: string): App<HTMLElement> | App<SVGElement> | null
  findAll(sel: string): Array<App<HTMLElement> | App<SVGElement>>
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

### Фабрики (`html.ts`, `svg.ts`)

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

`html` использует `document.createElement`; `svg` — `document.createElementNS('http://www.w3.org/2000/svg', tag)`.

`create` — deprecated-алиас `html`, будет удалён в следующей major-версии.

### Хелперы (`apply.ts`, `applySvg.ts`)

```ts
const apply = <T extends HTMLElement>(element: T, props: Partial<T>): void
const applySvg = <T extends SVGElement>(element: T, props: SvgAttributes): void
```

## Поведение `dispose` и `clear` (важно)

`dispose()` = снять ВСЕ собранные подписки + `node.remove()`. Только навешанные через
`on` / `config.on` попадают в пул. Если узел вернули в DOM нативным `append`, подписки
**не** восстанавливаются автоматически — их навешивают заново. Это осознанный компромисс:
не тащится реактивный слой, отслеживающий подключение к дереву.

`clear()` = снять ВСЕ собранные подписки + `node.replaceChildren()`. Узел остаётся в DOM.
Удобно для сброса компонента без его уничтожения — после очистки подписки навешиваются
заново через `on`.

## Нерешённое / вне скоупа

- **MathML** (`MathMLElement`) не обрабатывается — только `HTMLElement`/`SVGElement` и
  `GlobalEventHandlersEventMap`.
- **`apply` и собственные свойства** — присваиваются через `Reflect.set`, но для
  чтения сложных сеттеров сверка не выполняется (например `value` на `<input>`).
- Парсинг SVG-строк, загрузка SVG-файлов, санитизация внешнего SVG, реестр иконок,
  JSX и шаблонизация.
- Вложенные массивы `Child[]` внутри `Child[]` теперь разворачиваются рекурсивно.

## Критерии готовности

- [x] `html`/`svg` с типизированными `props`/`on`/`children`
- [x] `set` / `style` / `text` / `append` / `prepend` / `replace` / `clear` / `on` / `find` / `findAll` / `dispose`
- [x] SVG-атрибуты через `setAttribute`, `className` → `class`
- [x] отброс `null`/`false` без потери `0`
- [x] чистый `tsc --noEmit` и `vitest`
