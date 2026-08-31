import { type SvgAttributes } from '../types'

export const applySvg = <T extends SVGElement>(element: T, props: SvgAttributes): void => {
  Object.entries(props).forEach(([key, value]) => {
    if (value === undefined) return

    switch (key) {
      case 'style': {
        Object.assign(element.style, value)
        break
      }
      case 'dataset': {
        Object.assign(element.dataset, value)
        break
      }
      case 'textContent': {
        element.textContent = String(value)
        break
      }
      case 'className': {
        element.setAttribute('class', String(value))
        break
      }
      default: {
        element.setAttribute(key, String(value))
      }
    }
  })
}
