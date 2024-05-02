import { Octokit } from 'octokit'
import { components } from '@octokit/openapi-types/types'

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
  octokit: Octokit

  constructor(pat?: string) {
    this.octokit = new Octokit({ auth: pat })
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
            owner: owner,
            repo: repo,
            tag: version
          })
        : await this.octokit.rest.repos.getLatestRelease({
            owner: owner,
            repo: repo
          })
    return transformer.map(latestRelease.data)
  }
}
