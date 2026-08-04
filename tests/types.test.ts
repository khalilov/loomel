import { describe, expectTypeOf, it, beforeEach } from 'vitest'
import { JSDOM } from 'jsdom'
import { create } from '../src/create'

const setupDom = () => {
  const dom = new JSDOM('<!DOCTYPE html><body></body>')
  Object.assign(globalThis, {
    document: dom.window.document,
    HTMLElement: dom.window.HTMLElement,
    Node: dom.window.Node,
  })
}

describe('types', () => {
  beforeEach(() => {
    setupDom()
  })

  it('.on returns an unsubscribe function', () => {
    const btn = create('button')
    const off = btn.on('click', () => {})
    expectTypeOf(off).toEqualTypeOf<() => void>()
  })

  it('.on handler receives the correct event type', () => {
    const btn = create('button')
    btn.on('click', (e) => {
      expectTypeOf(e).toMatchTypeOf<Event>()
    })
  })

  it('.on config handlers are typed', () => {
    const input = create('input', {
      on: {
        input: (e) => {
          expectTypeOf(e).toMatchTypeOf<Event>()
        },
      },
    })
    expectTypeOf(input).toBeObject()
  })
})
