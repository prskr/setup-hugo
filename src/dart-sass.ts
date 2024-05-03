import { IGithubRelease, IReleaseLookup } from './asset-lookup'
import { DartSass, Hugo } from './constants'
import { components } from '@octokit/openapi-types'
import * as tc from '@actions/tool-cache'
import * as core from '@actions/core'
import { Platform } from './os'
import * as os from 'node:os'
import path from 'path'
import { mv } from '@actions/io'

export interface IDartSassInstallCommand {
  version: string
}

export class DartSassInstaller {
  private readonly releaseLookup: IReleaseLookup
  private readonly platform: Platform

  constructor(releaseLookup: IReleaseLookup) {
    this.platform = new Platform()
    this.releaseLookup = releaseLookup
  }

  async install(cmd: IDartSassInstallCommand): Promise<void> {
    const release = await this.releaseLookup.getRelease(
      DartSass.Org,
      DartSass.Repo,
      cmd.version,
      DartSassReleaseTransformer
    )

    core.debug(`Operating System: ${this.platform.os}`)
    core.debug(`Processor Architecture: ${this.platform.arch}`)

    const workDir = await this.platform.createWorkDir()
    const binDir = await this.platform.ensureBinDir(workDir)
    const tmpDir = os.tmpdir()

    const toolUrl = release.assetUrl(this.platform)

    if (!toolUrl) {
      throw new Error('No matching URL detected for given platform')
    }

    const destPath = path.join(
      tmpDir,
      `dart-sass${this.platform.archiveExtension()}`
    )
    await tc.downloadTool(toolUrl, destPath)

    core.debug(`Extract archive: ${destPath}`)
    if (this.platform.isWindows()) {
      await tc.extractZip(destPath, tmpDir)
    } else {
      await tc.extractTar(destPath, tmpDir)
    }

    core.debug(`move binaries to binDir: ${binDir}`)
    await mv(path.join(tmpDir, 'dart-sass', '*'), binDir)
  }
}

export const DartSassReleaseTransformer = {
  map(release: components['schemas']['release']): DartSassRelease {
    return new DartSassRelease(
      release.tag_name.replace('v', ''),
      release.assets
    )
  }
}

export class DartSassRelease implements IGithubRelease {
  private static readonly keyReplacementRegex = new RegExp(
    'dart-sass-*(\\d+.\\d+.\\d+)-'
  )
  private static readonly platformMapping: { [index: string]: string } = {
    linux: 'linux',
    win32: 'windows',
    darwin: 'macos'
  }

  private readonly assets: Map<string, string>

  readonly tag_name: string

  constructor(
    tag_name: string,
    assets: components['schemas']['release']['assets']
  ) {
    this.tag_name = tag_name
    this.assets = new Map<string, string>()

    assets.forEach(asset => {
      this.assets.set(
        asset.name.replace(DartSassRelease.keyReplacementRegex, ''),
        asset.url
      )
    })
  }

  assetUrl(platform: Platform): string | undefined {
    const mappedOS = DartSassRelease.platformMapping[platform.os]
    return this.assets.get(
      `${mappedOS}-${platform.arch}${platform.archiveExtension()}`
    )
  }
}
