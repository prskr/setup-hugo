import * as process from 'node:process'
import path from 'path'
import { Action } from './constants'
import * as io from '@actions/io'
import * as core from '@actions/core'

interface Env {
  [key: string]: string | undefined
}

export class Platform {
  os: string
  arch: string
  env: Env

  constructor(
    os: string = process.platform,
    arch: string = process.arch,
    env: Env = process.env
  ) {
    this.os = os
    this.arch = arch
    this.env = env
  }

  isWindows(): boolean {
    return this.os === 'win32'
  }

  archiveExtension(): string {
    if (this.isWindows()) {
      return '.zip'
    }
    return '.tar.gz'
  }

  binaryName(base: string): string {
    if (this.isWindows()) {
      return `${base}.exec`
    }
    return base
  }

  async createWorkDir(): Promise<string> {
    const workDir = path.join(this.getHomeDir(), Action.WorkDirName)
    await io.mkdirP(workDir)
    core.debug(`workDir: ${workDir}`)
    return workDir
  }

  async ensureBinDir(): Promise<string> {
    const binDir = path.join(this.getHomeDir(), Action.WorkDirName, 'bin')
    await io.mkdirP(binDir)
    core.debug(`binDir: ${binDir}`)
    return binDir
  }

  getHomeDir(): string {
    const homedir = this.isWindows()
      ? this.env['USERPROFILE'] || 'C:\\'
      : this.env.HOME || '/root'

    core.debug(`homeDir: ${homedir}`)

    return homedir
  }
}
