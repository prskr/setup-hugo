import { Platform } from '../src/os'

beforeEach(() => {
  jest.resetModules()
})

describe('Platform', () => {
  test('getHomeDir - should return non-empty string', () => {
    const homeDir = new Platform('linux', undefined, {
      HOME: '/home/prskr'
    }).getHomeDir()

    expect(homeDir).toBe('/home/prskr')
  })

  test('getHomeDir - return USERPROFILE for win32 platform', () => {
    const homeDir = new Platform('win32', undefined, {
      USERPROFILE: 'C:\\Users\\prskr'
    }).getHomeDir()

    expect(homeDir).toBe('C:\\Users\\prskr')
  })
})
