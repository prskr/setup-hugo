export function errorMsg(e: unknown): string | undefined {
  if (typeof e === 'string') {
    return e
  } else if (e instanceof Error) {
    return e.message
  }
}
