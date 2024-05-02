import * as core from '@actions/core'
import { Hugo } from './constants'
import { IGithubRelease, IReleaseLookup } from './asset-lookup'
import { Platform } from './os'
import { components } from '@octokit/openapi-types'
import { downloadTool } from '@actions/tool-cache'

export interface IHugoInstallCommand {
  version: string
  extended: boolean
}

export class HugoInstaller {
  private readonly releaseLookup: IReleaseLookup
  private readonly platform: Platform

  constructor(releaseLookup: IReleaseLookup) {
    this.platform = new Platform()
    this.releaseLookup = releaseLookup
  }

  async install(cmd: IHugoInstallCommand): Promise<void> {
    const release = await this.releaseLookup.getRelease(
      Hugo.Org,
      Hugo.Repo,
      cmd.version,
      HugoReleaseTransformer
    )

    core.debug(`Hugo extended: ${cmd.extended}`)
    core.debug(`Operating System: ${this.platform.os}`)
    core.debug(`Processor Architecture: ${this.platform.arch}`)

    const workDir = await this.platform.createWorkDir()
    const binDir = await this.platform.createBinDir(workDir)
    const tempDir = await this.platform.createTempDir(workDir)

    const toolUrl = release.assetUrl(this.platform, cmd.extended)

    if (!toolUrl) {
      throw new Error('No matching URL detected for given platform')
    }

    await downloadTool(toolUrl, binDir, tempDir)
  }
}

export const HugoReleaseTransformer = {
  map(release: components['schemas']['release']): HugoRelease {
    return new HugoRelease(release.tag_name.replace('v', ''), release.assets)
  }
}

export class HugoRelease implements IGithubRelease {
  private static readonly keyReplacementRegex = new RegExp(
    'hugo_(extended_)*(\\d+.\\d+.\\d+)_'
  )

  readonly tag_name: string

  private readonly defaultAssets: Map<string, string>
  private readonly extendedAssets: Map<string, string>

  constructor(
    tag_name: string,
    assets: components['schemas']['release']['assets']
  ) {
    this.tag_name = tag_name
    this.defaultAssets = new Map<string, string>()
    this.extendedAssets = new Map<string, string>()

    assets.forEach(asset => {
      if (asset.name.includes('extended')) {
        this.extendedAssets.set(
          asset.name.replace(HugoRelease.keyReplacementRegex, ''),
          asset.url
        )
      } else {
        this.defaultAssets.set(
          asset.name.replace(HugoRelease.keyReplacementRegex, ''),
          asset.url
        )
      }
    })
  }

  assetUrl(platform: Platform, extended: boolean): string | undefined {
    const src = extended ? this.extendedAssets : this.defaultAssets
    const arch = platform.os === 'darwin' ? 'universal' : platform.arch
    const key = `${platform.os}-${arch}${platform.archiveExtension()}`

    return src.get(key)
  }
}
