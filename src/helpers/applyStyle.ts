import { type StyleProps } from '../types'

const UNITLESS_PROPERTIES = new Set([
  'animationIterationCount',
  'aspectRatio',
  'borderImageOutset',
  'borderImageSlice',
  'borderImageWidth',
  'columnCount',
  'fillOpacity',
  'flex',
  'flexGrow',
  'flexShrink',
  'floodOpacity',
  'fontWeight',
  'gridArea',
  'gridColumn',
  'gridColumnEnd',
  'gridColumnStart',
  'gridRow',
  'gridRowEnd',
  'gridRowStart',
  'lineClamp',
  'lineHeight',
  'opacity',
  'order',
  'orphans',
  'scale',
  'stopOpacity',
  'strokeDasharray',
  'strokeDashoffset',
  'strokeMiterlimit',
  'strokeOpacity',
  'strokeWidth',
  'tabSize',
  'widows',
  'zIndex',
  'zoom',
])

export const applyStyle = (element: HTMLElement | SVGElement, props: StyleProps): void => {
  for (const [property, value] of Object.entries(props)) {
    const custom = property.startsWith('--')
    const normalized =
      typeof value === 'number' && value !== 0 && !custom && !UNITLESS_PROPERTIES.has(property)
        ? `${value}px`
        : String(value)

    if (custom) {
      element.style.setProperty(property, normalized)
    } else {
      Reflect.set(element.style, property, normalized)
    }
  }
}
