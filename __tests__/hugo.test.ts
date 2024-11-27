import { HugoInstaller } from '../src/hugo'
import { OctokitReleaseLookup } from '../src/asset-lookup'
import * as fs from 'node:fs'
import path from 'path'
import * as os from 'node:os'
import { Platform } from '../src/os'

let tmpDir = ''

beforeEach(() => {
  jest.resetModules()
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-hugo-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true })
})

describe('Install Hugo', () => {
  test('Download latest Hugo', async () => {
    const releaseLookup = new OctokitReleaseLookup(
      process.env.GITHUB_TOKEN || undefined
    )
    const platformMock = new Platform('linux', undefined, { HOME: tmpDir })
    const hugo = new HugoInstaller(releaseLookup, platformMock)

    expect(
      async () =>
        await hugo.install({
          version: 'latest'
        })
    ).not.toThrow()
  }, 30_000)

  test('Download latest Hugo - extended', async () => {
    const releaseLookup = new OctokitReleaseLookup(
      process.env.GITHUB_TOKEN || undefined
    )
    const platformMock = new Platform('linux', undefined, { HOME: tmpDir })
    const hugo = new HugoInstaller(releaseLookup, platformMock)

    expect(
      async () =>
        await hugo.install({
          version: 'latest',
          extended: true
        })
    ).not.toThrow()
  }, 30_000)

  test('Download latest Hugo - with deploy', async () => {
    const releaseLookup = new OctokitReleaseLookup(
      process.env.GITHUB_TOKEN || undefined
    )
    const platformMock = new Platform('linux', undefined, { HOME: tmpDir })
    const hugo = new HugoInstaller(releaseLookup, platformMock)

    expect(
      async () =>
        await hugo.install({
          version: 'latest',
          withDeploy: true
        })
    ).not.toThrow()
  }, 30_000)
})
