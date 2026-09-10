import { type StyleProps, type SvgAttributes } from '../types'
import { applyStyle } from './applyStyle'

export const applySvg = <T extends SVGElement>(element: T, props: SvgAttributes): void => {
  Object.entries(props).forEach(([key, value]) => {
    if (value === undefined) return

    switch (key) {
      case 'style': {
        applyStyle(element, value as StyleProps)
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
