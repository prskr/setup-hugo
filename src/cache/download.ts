import * as tc from '@actions/tool-cache'
import { Hugo as HugoTool } from '../constants'
import * as io from '@actions/io'

async function downloadTool(
  toolURL: string,
  binDir: string,
  tempDir: string
): Promise<void> {
  const toolAssets: string = await tc.downloadTool(toolURL)
  let toolBin = ''
  if (process.platform === 'win32') {
    const toolExtractedFolder: string = await tc.extractZip(toolAssets, tempDir)
    toolBin = `${toolExtractedFolder}/${HugoTool.CmdName}.exe`
  } else {
    const toolExtractedFolder: string = await tc.extractTar(toolAssets, tempDir)
    toolBin = `${toolExtractedFolder}/${HugoTool.CmdName}`
  }
  await io.mv(toolBin, binDir)
}
