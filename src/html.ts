import { apply } from './helpers/apply'
import { makeApp } from './helpers/makeApp'
import { type App, type HtmlElementConfig } from './types'

export const html = <Tag extends keyof HTMLElementTagNameMap>(
  tag: Tag,
  config?: HtmlElementConfig<Tag>,
): App<HTMLElementTagNameMap[Tag]> => {
  const node = document.createElement(tag)
  const app = makeApp(node, (props) => apply(node, props))

  if (config) {
    if (config.props) apply(node, config.props)

    if (config.on) {
      for (const [type, handler] of Object.entries(config.on)) {
        app.on(type as keyof GlobalEventHandlersEventMap, handler as EventListener)
      }
    }

    if (config.children) {
      const children = Array.isArray(config.children) ? config.children : [config.children]
      app.append(...children)
    }
  }

  return app
}
