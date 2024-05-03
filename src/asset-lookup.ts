import { getOctokit } from '@actions/github'
import { components } from '@octokit/openapi-types/types'
import { GitHub } from '@actions/github/lib/utils'
import { Octokit } from 'octokit'

export interface IGithubRelease {
  readonly tag_name: string
}

export interface IReleaseTransformer<T extends IGithubRelease> {
  map(release: components['schemas']['release']): T
}

export interface IReleaseLookup {
  getRelease<T extends IGithubRelease>(
    user: string,
    repo: string,
    version: string | undefined,
    transformer: IReleaseTransformer<T>
  ): Promise<T>
}

export class OctokitReleaseLookup implements IReleaseLookup {
  octokit: InstanceType<typeof GitHub> | Octokit

  constructor(pat?: string) {
    this.octokit = pat ? getOctokit(pat) : new Octokit()
  }

  async getRelease<T extends IGithubRelease>(
    owner: string,
    repo: string,
    version: string | undefined,
    transformer: IReleaseTransformer<T>
  ): Promise<T> {
    const latestRelease =
      version && version !== 'latest'
        ? await this.octokit.rest.repos.getReleaseByTag({
            owner,
            repo,
            tag: version
          })
        : await this.octokit.rest.repos.getLatestRelease({
            owner,
            repo
          })
    return transformer.map(latestRelease.data)
  }
}
