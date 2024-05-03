import fs from 'node:fs'
import path from 'path'
import os from 'node:os'
import { OctokitReleaseLookup } from '../src/asset-lookup'
import { Platform } from '../src/os'
import { DartSassInstaller } from '../src/dart-sass'

let tmpDir = ''

beforeEach(() => {
  jest.resetModules()
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'setup-hugo-'))
})

afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true })
})

describe('Install dart-sass', () => {
  test('Download latest dart-sass', async () => {
    const releaseLookup = new OctokitReleaseLookup()
    const platformMock = new Platform('linux', undefined, { HOME: tmpDir })
    const dartSassInstaller = new DartSassInstaller(releaseLookup, platformMock)

    expect(
      async () =>
        await dartSassInstaller.install({
          version: 'latest'
        })
    ).not.toThrow()
  })
})
