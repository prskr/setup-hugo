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

  archiveExtension(): string {
    if (this.os === 'win32') {
      return '.zip'
    }
    return '.tar.gz'
  }

  async createWorkDir(): Promise<string> {
    const workDir = path.join(this.getHomeDir(), Action.WorkDirName)
    await io.mkdirP(workDir)
    core.debug(`workDir: ${workDir}`)
    return workDir
  }

  async createTempDir(workDir: string): Promise<string> {
    const tempDir = path.join(workDir, Action.TempDirName)
    await io.mkdirP(tempDir)
    core.debug(`tempDir: ${tempDir}`)
    return tempDir
  }

  async createBinDir(workDir: string): Promise<string> {
    const binDir = path.join(workDir, 'bin')
    await io.mkdirP(binDir)
    core.addPath(binDir)
    core.debug(`binDir: ${binDir}`)
    return binDir
  }

  getHomeDir(): string {
    const homedir =
      this.os === 'win32'
        ? this.env['USERPROFILE'] || 'C:\\'
        : this.env.HOME || '/root'

    core.debug(`homeDir: ${homedir}`)

    return homedir
  }
}
