import * as core from '@actions/core'
import { HugoInstaller } from './hugo'
import { IReleaseLookup, OctokitReleaseLookup } from './asset-lookup'
import { DartSassInstaller } from './dart-sass'

export async function run(): Promise<void> {
  const releaseLookup: IReleaseLookup = new OctokitReleaseLookup(
    core.getInput('github-token')
  )
  const hugoInstaller = new HugoInstaller(releaseLookup)

  await hugoInstaller.install({
    version: core.getInput('hugo-version'),
    extended: core.getBooleanInput('extended')
  })

  if (!core.getBooleanInput('dart-sass')) return

  const dartSassInstaller = new DartSassInstaller(releaseLookup)
  await dartSassInstaller.install({
    version: core.getInput('dart-sass-version')
  })
}
