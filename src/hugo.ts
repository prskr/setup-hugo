import * as core from '@actions/core'
import { Hugo } from './constants'
import { IGithubRelease, IReleaseLookup } from './asset-lookup'
import { Platform } from './os'
import { components } from '@octokit/openapi-types'
import * as tc from '@actions/tool-cache'
import path from 'path'
import * as os from 'node:os'
import { mv, rmRF } from '@actions/io'
import { randomUUID } from 'crypto'
import { errorMsg } from './utils/error'

export interface IHugoInstallCommand {
  version?: string
  extended?: boolean
  withDeploy?: boolean
}

export class HugoInstaller {
  private readonly releaseLookup: IReleaseLookup
  private readonly platform: Platform

  constructor(releaseLookup: IReleaseLookup, platform?: Platform) {
    this.platform = platform ?? new Platform()
    this.releaseLookup = releaseLookup
  }

  async install(cmd: IHugoInstallCommand): Promise<void> {
    const release = await this.releaseLookup.getRelease(
      Hugo.Org,
      Hugo.Repo,
      cmd.version,
      HugoReleaseTransformer
    )

    core.debug(`Hugo extended: ${cmd.extended ?? false}`)
    core.debug(`Hugo with deploy: ${cmd.withDeploy ?? false}`)
    core.debug(`Operating System: ${this.platform.os}`)
    core.debug(`Processor Architecture: ${this.platform.arch}`)

    const hugoBinName = this.platform.binaryName(Hugo.CmdName)
    const tmpDir = os.tmpdir()

    try {
      const cachedTool = tc.find(
        Hugo.Name,
        release.tag_name,
        this.platform.arch
      )
      if (cachedTool) {
        core.addPath(cachedTool)
        return
      }
    } catch (e) {
      core.warning(`Failed to lookup tool in cache: ${errorMsg(e)}`)
    }

    const toolUrl = release.assetUrl(this.platform, cmd.extended)

    if (!toolUrl) {
      throw new Error('No matching URL detected for given platform')
    }

    const destPath = path.join(
      tmpDir,
      `hugo_${randomUUID()}${this.platform.archiveExtension()}`
    )
    await tc.downloadTool(toolUrl, destPath)

    core.debug(`Extract archive: ${destPath}`)
    if (this.platform.isWindows()) {
      await tc.extractZip(destPath, tmpDir)
    } else {
      await tc.extractTar(destPath, tmpDir)
    }

    await rmRF(destPath)

    try {
      const cachedHugoPath = await tc.cacheFile(
        path.join(tmpDir, hugoBinName),
        hugoBinName,
        Hugo.Name,
        release.tag_name,
        this.platform.arch
      )

      core.addPath(cachedHugoPath)
    } catch (e) {
      core.warning(`Failed to cache Hugo install: ${errorMsg(e)}`)

      const binDir = await this.platform.ensureBinDir()
      core.debug(`move binaries to binDir: ${binDir}`)
      await mv(path.join(tmpDir, hugoBinName), binDir)
      core.addPath(binDir)
    }
  }
}

export const HugoReleaseTransformer = {
  map(release: components['schemas']['release']): HugoRelease {
    return new HugoRelease(release.tag_name.replace('v', ''), release.assets)
  }
}

export class HugoRelease implements IGithubRelease {
  private static readonly keyReplacementRegex = new RegExp(
    'hugo_(extended_)*(withdeploy_)*(\\d+.\\d+.\\d+)_'
  )

  readonly tag_name: string

  private readonly defaultAssets: Map<string, string>
  private readonly extendedAssets: Map<string, string>
  private readonly withDeployAssets: Map<string, string>

  constructor(
    tag_name: string,
    assets: components['schemas']['release']['assets']
  ) {
    this.tag_name = tag_name
    this.defaultAssets = new Map<string, string>()
    this.extendedAssets = new Map<string, string>()
    this.withDeployAssets = new Map<string, string>()

    for (const asset of assets) {
      if (asset.name.includes('extended_withdeploy')) {
        this.withDeployAssets.set(
          asset.name.replace(HugoRelease.keyReplacementRegex, ''),
          asset.browser_download_url
        )
      } else if (asset.name.includes('extended')) {
        this.extendedAssets.set(
          asset.name.replace(HugoRelease.keyReplacementRegex, ''),
          asset.browser_download_url
        )
      } else {
        this.defaultAssets.set(
          asset.name.replace(HugoRelease.keyReplacementRegex, ''),
          asset.browser_download_url
        )
      }
    }
  }

  assetUrl(
    platform: Platform,
    extended?: boolean,
    withDeploy?: boolean
  ): string | undefined {
    let assets = this.defaultAssets
    if (withDeploy) {
      assets = this.withDeployAssets
    } else if (extended) {
      assets = this.extendedAssets
    }

    const arch = platform.os === 'darwin' ? 'universal' : platform.arch
    const key = `${platform.os}-${arch}${platform.archiveExtension()}`

    return assets.get(key)
  }
}
