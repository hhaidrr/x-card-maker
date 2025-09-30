/**
 * Twitter profile URL parser utility
 */

export class TwitterUrlParser {
  private static readonly TWITTER_URL_PATTERNS = [
    // Standard Twitter URLs
    /^https?:\/\/(www\.)?twitter\.com\/([a-zA-Z0-9_]+)\/?$/,
    /^https?:\/\/(www\.)?twitter\.com\/([a-zA-Z0-9_]+)\/status\/.*$/,
    /^https?:\/\/(www\.)?twitter\.com\/([a-zA-Z0-9_]+)\/with_replies\/?$/,
    /^https?:\/\/(www\.)?twitter\.com\/([a-zA-Z0-9_]+)\/media\/?$/,
    /^https?:\/\/(www\.)?twitter\.com\/([a-zA-Z0-9_]+)\/likes\/?$/,
    /^https?:\/\/(www\.)?twitter\.com\/([a-zA-Z0-9_]+)\/lists\/?$/,
    /^https?:\/\/(www\.)?twitter\.com\/([a-zA-Z0-9_]+)\/moments\/?$/,
    
    // X.com URLs (new domain)
    /^https?:\/\/(www\.)?x\.com\/([a-zA-Z0-9_]+)\/?$/,
    /^https?:\/\/(www\.)?x\.com\/([a-zA-Z0-9_]+)\/status\/.*$/,
    /^https?:\/\/(www\.)?x\.com\/([a-zA-Z0-9_]+)\/with_replies\/?$/,
    /^https?:\/\/(www\.)?x\.com\/([a-zA-Z0-9_]+)\/media\/?$/,
    /^https?:\/\/(www\.)?x\.com\/([a-zA-Z0-9_]+)\/likes\/?$/,
    /^https?:\/\/(www\.)?x\.com\/([a-zA-Z0-9_]+)\/lists\/?$/,
    /^https?:\/\/(www\.)?x\.com\/([a-zA-Z0-9_]+)\/moments\/?$/,
    
    // Mobile app URLs
    /^https?:\/\/mobile\.twitter\.com\/([a-zA-Z0-9_]+)\/?$/,
    /^https?:\/\/mobile\.twitter\.com\/([a-zA-Z0-9_]+)\/status\/.*$/,
    
    // Just username (without protocol)
    /^@?([a-zA-Z0-9_]+)$/,
  ];

  /**
   * Extract username from a Twitter profile URL
   * @param url - The Twitter profile URL or username
   * @returns The extracted username without @ symbol
   * @throws Error if the URL is invalid or username cannot be extracted
   */
  static extractUsername(url: string): string {
    if (!url || typeof url !== 'string') {
      throw new Error('Invalid URL: URL must be a non-empty string');
    }

    // Clean the URL
    const cleanUrl = url.trim();

    // Try to match against all patterns
    for (const pattern of this.TWITTER_URL_PATTERNS) {
      const match = cleanUrl.match(pattern);
      if (match) {
        // The username is always in the last capture group
        const username = match[match.length - 1];
        if (username && this.isValidUsername(username)) {
          return username;
        }
      }
    }

    throw new Error(`Invalid Twitter URL: Could not extract username from "${url}"`);
  }

  /**
   * Validate if a username follows Twitter's rules
   * @param username - The username to validate
   * @returns True if valid, false otherwise
   */
  private static isValidUsername(username: string): boolean {
    // Twitter username rules:
    // - 1-15 characters
    // - Only letters, numbers, and underscores
    // - Cannot start with a number
    // - Cannot be empty
    if (!username || username.length === 0 || username.length > 15) {
      return false;
    }

    // Check if it contains only valid characters
    if (!/^[a-zA-Z0-9_]+$/.test(username)) {
      return false;
    }

    // Check if it doesn't start with a number
    if (/^[0-9]/.test(username)) {
      return false;
    }

    return true;
  }

  /**
   * Check if a URL is a valid Twitter profile URL
   * @param url - The URL to check
   * @returns True if valid Twitter URL, false otherwise
   */
  static isValidTwitterUrl(url: string): boolean {
    try {
      this.extractUsername(url);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Normalize a Twitter URL to a standard format
   * @param url - The Twitter URL to normalize
   * @returns Normalized URL in format https://twitter.com/username
   */
  static normalizeUrl(url: string): string {
    const username = this.extractUsername(url);
    return `https://twitter.com/${username}`;
  }
}