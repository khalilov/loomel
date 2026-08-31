import { applySvg } from './helpers/applySvg'
import { makeApp } from './helpers/makeApp'
import { type App, type SvgElementConfig } from './types'

const SVG_NS = 'http://www.w3.org/2000/svg' as const

export const svg = <Tag extends keyof SVGElementTagNameMap>(
  tag: Tag,
  config?: SvgElementConfig,
): App<SVGElementTagNameMap[Tag]> => {
  const node = document.createElementNS(SVG_NS, tag)
  const app = makeApp(node, (props) => applySvg(node, props))

  if (config) {
    if (config.props) applySvg(node, config.props)

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
