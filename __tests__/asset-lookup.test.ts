import { OctokitReleaseLookup } from '../src/asset-lookup'
import { Platform } from '../src/os'
import { HugoReleaseTransformer } from '../src/hugo'
import { DartSass, Hugo } from '../src/constants'
import { DartSassReleaseTransformer } from '../src/dart-sass'

beforeEach(() => {
  jest.resetModules()
})

describe('Asset lookup', () => {
  test('Hugo: should return valid version', async () => {
    const octoVersionDetermination = new OctokitReleaseLookup()

    const release = await octoVersionDetermination.getRelease(
      Hugo.Org,
      Hugo.Repo,
      '',
      HugoReleaseTransformer
    )
    expect(release.tag_name).toMatch(new RegExp('\\d+.\\d+.\\d+'))
    const archiveUrl = release.assetUrl(new Platform(), false)
    expect(archiveUrl).not.toBe(undefined)
  })

  test('Dart-Sass: should return valid version', async () => {
    const octoVersionDetermination = new OctokitReleaseLookup()

    const release = await octoVersionDetermination.getRelease(
      DartSass.Org,
      DartSass.Repo,
      '',
      DartSassReleaseTransformer
    )
    expect(release.tag_name).toMatch(new RegExp('\\d+.\\d+.\\d+'))
    const archiveUrl = release.assetUrl(new Platform())
    expect(archiveUrl).not.toBe(undefined)
  })
})
