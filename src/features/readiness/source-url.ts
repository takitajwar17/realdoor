/** Only absolute http(s) URLs are openable in the UI. */
export function hasOpenableSourceUrl(url: string): boolean {
  return /^https?:\/\//iu.test(url.trim());
}
