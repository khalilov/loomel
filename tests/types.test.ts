import { describe, expectTypeOf, it, beforeEach } from 'vitest'
import { JSDOM } from 'jsdom'
import { html } from '../src/html'
import { svg } from '../src/svg'
import { type App } from '../src/types'

const setupDom = () => {
  const dom = new JSDOM('<!DOCTYPE html><body></body>')
  Object.assign(globalThis, {
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    Element: dom.window.Element,
    SVGElement: dom.window.SVGElement,
    Node: dom.window.Node,
  })
}

describe('types', () => {
  beforeEach(() => {
    setupDom()
  })

  it('html returns App<HTMLButtonElement>', () => {
    expectTypeOf(html('button').node).toEqualTypeOf<HTMLButtonElement>()
  })

  it('svg returns App<SVGSVGElement>', () => {
    expectTypeOf(svg('svg').node).toEqualTypeOf<SVGSVGElement>()
  })

  it('svg returns App<SVGPathElement>', () => {
    expectTypeOf(svg('path').node).toEqualTypeOf<SVGPathElement>()
  })

  it('.on returns an unsubscribe function', () => {
    const btn = html('button')
    const off = btn.on('click', () => {})
    expectTypeOf(off).toEqualTypeOf<() => void>()
  })

  it('.findAll returns HTML or SVG Apps', () => {
    expectTypeOf(html('div').findAll('span')).toEqualTypeOf<Array<App<HTMLElement> | App<SVGElement>>>()
  })

  it('.text and .on options preserve their contracts', () => {
    const el = html('button')

    expectTypeOf(el.text(42)).toEqualTypeOf<typeof el>()
    expectTypeOf(el.on('click', () => {}, { once: true })).toEqualTypeOf<() => void>()
  })

  it('.style accepts CSS properties with numeric values and chains', () => {
    const el = html('div')
    expectTypeOf(el.style({ width: 10, opacity: 1, '--gap': '2rem' })).toEqualTypeOf<typeof el>()
  })

  it('.style rejects unknown CSS properties', () => {
    const el = html('div')
    // @ts-expect-error unknown CSS property
    el.style({ notARealProperty: 'x' })
  })

  it('.on handler receives the correct event type', () => {
    const btn = html('button')
    btn.on('click', (e) => {
      expectTypeOf(e).toMatchTypeOf<Event>()
    })
  })

  it('.on config handlers are typed', () => {
    const input = html('input', {
      on: {
        input: (e) => {
          expectTypeOf(e).toMatchTypeOf<Event>()
        },
      },
    })
    expectTypeOf(input).toBeObject()
  })
})
