import { describe, expectTypeOf, it, beforeEach } from 'vitest'
import { JSDOM } from 'jsdom'
import { html } from '../src/html'
import { svg } from '../src/svg'

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
