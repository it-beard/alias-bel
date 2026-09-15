import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const read = (path) => readFileSync(resolve(root, path), 'utf8')

describe('публікацыя на GitHub Pages', () => {
  it('CNAME трапляе ў зборку, інакш публікацыя сатрэ свой дамен', () => {
    expect(read('public/CNAME').trim()).toBe('alias.itbeard.com')
  })

  it('воркфлоў дэплою запускаецца пры пушы ў main і публікуе толькі пасля тэстаў', () => {
    const workflow = read('.github/workflows/deploy.yml')
    expect(workflow).toMatch(/push:\s*\n\s*branches: \[main\]/)
    const order = ['npm ci', 'npm run lint', 'npm test', 'npm run build', 'npx gh-pages'].map((step) => workflow.indexOf(step))
    order.forEach((index) => expect(index).toBeGreaterThan(-1))
    expect([...order].sort((a, b) => a - b)).toEqual(order)
  })

  it('CI для pull request і канфіг Dependabot на месцы', () => {
    expect(read('.github/workflows/ci.yml')).toMatch(/pull_request:/)
    const dependabot = read('.github/dependabot.yml')
    expect(dependabot).toMatch(/package-ecosystem: npm/)
    expect(dependabot).toMatch(/package-ecosystem: github-actions/)
    expect(existsSync(resolve(root, 'package-lock.json'))).toBe(true)
  })
})
