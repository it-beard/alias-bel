import { describe, expect, it } from 'vitest'
import { existsSync, readFileSync } from 'node:fs'
import { resolve } from 'node:path'

const root = resolve(import.meta.dirname, '..')
const read = (path) => readFileSync(resolve(root, path), 'utf8')
const readBuffer = (path) => readFileSync(resolve(root, path))

describe('публікацыя на GitHub Pages', () => {
  it('CNAME трапляе ў зборку, інакш публікацыя сатрэ свой дамен', () => {
    expect(read('public/CNAME').trim()).toBe('alias.itbeard.com')
  })

  it('воркфлоў дэплою запускаецца пры пушы ў main і публікуе толькі пасля праверак', () => {
    const workflow = read('.github/workflows/deploy.yml')
    expect(workflow).toMatch(/push:\s*\n\s*branches: \[main\]/)
    // Самі крокі жывуць у агульным checks.yml; сюды ён прыходзіць выклікам.
    expect(workflow).toContain('uses: ./.github/workflows/checks.yml')
    expect(workflow).toContain('upload-pages-artifact: true')
    // Публікацыя чакае праверак — без гэтага сайт абнаўляўся б і на чырвоных тэстах.
    expect(workflow).toMatch(/needs: check/)
    expect(workflow).toContain('actions/deploy-pages@')
    // Без гэтых дазволаў deploy-pages падае.
    expect(workflow).toMatch(/pages: write/)
    expect(workflow).toMatch(/id-token: write/)
  })

  it('агульныя праверкі ідуць па чарзе і выкладаюць dist/ для Pages', () => {
    const checks = read('.github/workflows/checks.yml')
    const order = ['npm ci', 'npm run lint', 'npm test', 'npm run build', 'actions/upload-pages-artifact'].map((step) => checks.indexOf(step))
    order.forEach((index) => expect(index).toBeGreaterThan(-1))
    expect([...order].sort((a, b) => a - b)).toEqual(order)
    expect(checks).toContain('path: dist')
  })

  it('CI для pull request і канфіг Dependabot на месцы', () => {
    expect(read('.github/workflows/ci.yml')).toMatch(/pull_request:/)
    expect(read('.github/workflows/ci.yml')).toContain('uses: ./.github/workflows/checks.yml')
    const dependabot = read('.github/dependabot.yml')
    expect(dependabot).toMatch(/package-ecosystem: npm/)
    expect(dependabot).toMatch(/package-ecosystem: github-actions/)
    expect(existsSync(resolve(root, 'package-lock.json'))).toBe(true)
  })

  it('мае поўныя SEO- і social-метаданыя з кананічным даменам', () => {
    const html = read('index.html')
    expect(html).toContain('<link rel="canonical" href="https://alias.itbeard.com/" />')
    expect(html).toContain('<meta name="robots" content="index, follow, max-image-preview:large" />')
    expect(html).toContain('<meta property="og:image" content="https://alias.itbeard.com/og-image.png" />')
    expect(html).toContain('<meta property="og:image:width" content="1200" />')
    expect(html).toContain('<meta property="og:image:height" content="630" />')
    expect(html).toContain('<meta name="twitter:card" content="summary_large_image" />')

    const jsonLd = html.match(/<script type="application\/ld\+json">([\s\S]*?)<\/script>/)?.[1]
    const graph = JSON.parse(jsonLd)['@graph']
    expect(graph.some((item) => item['@type'] === 'WebApplication')).toBe(true)
    expect(graph.find((item) => item['@type'] === 'FAQPage').mainEntity).toHaveLength(3)
  })

  it('аддае robots, sitemap, GEO-апісанне і social preview патрэбнага памеру', () => {
    expect(read('public/robots.txt')).toContain('Sitemap: https://alias.itbeard.com/sitemap.xml')
    expect(read('public/sitemap.xml')).toContain('<loc>https://alias.itbeard.com/</loc>')
    expect(read('public/llms.txt')).toContain('886 унікальных беларускіх слоў')

    const image = readBuffer('public/og-image.png')
    expect(image.subarray(1, 4).toString()).toBe('PNG')
    expect(image.readUInt32BE(16)).toBe(1200)
    expect(image.readUInt32BE(20)).toBe(630)
  })
})
