import * as core from '@actions/core'
import * as main from './main'
import { errorMsg } from './utils/error'
;(async (): Promise<void> => {
  try {
    await main.run()
  } catch (e) {
    core.setFailed(`Action failed with error ${errorMsg(e)}`)
  }
})()
