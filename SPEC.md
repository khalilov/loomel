# SPEC — реактивная фабрика HTML-элементов

## Назначение

Супер-мини библиотека для процедурной генерации и последующего манипулирования
HTML-элементами без JSX и шаблонов. Атом библиотеки — **реактивный узел** (`App`):
обёртка над нативным `HTMLElement`, которая держит ссылку на элемент и закрывает его
жизненный цикл (создание, обновление свойств, компоновка детей, подписка на события,
удаление).

## Мотивация

В рендер-коде проекта `apps/app-client` накопились повторяющиеся паттерны:

- создание элемента из объектного конфига (`createElements`) отдавало голый
  `HTMLElement` — обновление и компоновка оставались на вызвавшем коде;
- списки перерисовывались через ручные `querySelector` + `replaceChildren`
  (`DialogManager.setNotifications`);
- шаблон + `cloneNode` для повторяющихся элементов (`createCarriedResourcesPanel`).

Библиотека закрывает эти паттерны одним контрактом: создал узел один раз, дальше —
`set` / `append` / `replace` / `on` / `dispose`.

## Ключевые решения

1. **Один атом — `App<T>`.** Возвращается не голый элемент, а узел. Настоящий элемент
   всегда доступен как `app.node` — это точка интеграции с нативным API и существующим
   кодом (`document.body.append(el.node)`, передача в функции, ждущие `HTMLElement`).
2. **Cтрогая типизация по тегу.** `create(tag, config)` возвращает
   `App<HTMLElementTagNameMap[Tag]>`; `props` — `Partial<HTMLElementTagNameMap[Tag]>`.
   Автокомплит и ошибки на уровне TS, без runtime-валидации. Проверки только на
   непечатанных границах (конфиг приходит из JSON/сети).
3. **Свойства применяются общим хелпером `applyProps`.** Частные случаи
   (`className`, `style`, `dataset`) мержатся в под-объекты, прочее — `Reflect.set`.
   Один и тот же хелпер используется и при создании, и в `set`.
4. **Дети — плоский список с отбросом скобок.** `Child = HTMLElement | App |
string | number | null | false`. `null`/`false` удобны для условной вставки и
   отсекаются до вставки. Примитивы конвертируются в строку (в т.ч. `0` не теряется —
   отсев по значению, не по truthiness).
5. **События — только через `on`.** Оба слоя: декларативный `config.on` и метод
   `app.on(type, handler)`. Метод возвращает функцию отписки. Подписки собираются для
   `dispose`.
6. **`dispose` — полная ликвидация.** Снимает все собранные подписки и удаляет элемент
   из дерева. Повторное использование — навесить подписки заново через `on` (одна
   строка). Никакого скрытого авто-жизненного цикла через `MutationObserver`.

## Публичный API

### Типы (`types.ts`)

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

### Фабрика (`create.ts`)

```ts
const create = <Tag extends keyof HTMLElementTagNameMap>(
  tag: Tag,
  config?: ElementConfig<Tag>,
): App<HTMLElementTagNameMap[Tag]>
```

### Хелпер (`apply.ts`)

```ts
const applyProps = <T extends HTMLElement>(element: T, props: Partial<T>): void
```

## Поведение `dispose` (важно)

`dispose()` = снять ВСЕ собранные подписки + `node.remove()`. Только навешанные через
`on` / `config.on` попадают в пул. Если узел вернули в DOM нативным `append`, подписки
**не** восстанавливаются автоматически — их навешивают заново. Это осознанный компромисс:
не тащится реактивный слой, отслеживающий подключение к дереву.

## Нерешённое / вне скоупа

- **SVG** (`SVGElement`) не обрабатывается — только `HTMLElement` и `HTMLElementEventMap`.
- **`applyProps` и собственные свойства** — присваиваются через `Reflect.set`, но для
  чтения сложных сеттеров сверка не выполняется (например `value` на `<input>`).
- Вложенные массивы `Child[]` внутри `Child[]` не разворачиваются рекурсивно.

## Критерии готовности v0.1

- [x] `create` с типизированными `props`/`on`/`children`
- [x] `set` / `append` / `replace` / `on` / `dispose`
- [x] отброс `null`/`false` без потери `0`
- [x] чистый `tsc --noEmit` и `bun test` (5 тестов)
