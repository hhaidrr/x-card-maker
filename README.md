# X Card Maker

A Node.js TypeScript library that takes a Twitter/X profile URL, parses the username, fetches profile data from Twitter's API, and stores it in a structured dataclass.

## Features

- 🔗 **URL Parsing**: Extract usernames from various Twitter URL formats
- 🐦 **Twitter API Integration**: Fetch comprehensive profile data using Twitter API v2
- 📊 **Structured Data**: Store data in TypeScript dataclasses with helper methods
- 🎯 **Type Safety**: Full TypeScript support with proper interfaces
- 🛡️ **Error Handling**: Comprehensive error handling for API and parsing errors

## Installation

```bash
npm install
```

## Setup

1. Copy the environment example file:
```bash
cp env.example .env
```

2. Get a Twitter API Bearer Token from [Twitter Developer Portal](https://developer.twitter.com/)

3. Add your bearer token to the `.env` file:
```
BEARER_TOKEN=your_bearer_token_here
```

## Usage

### Basic Usage

```typescript
import { getTwitterProfileData } from './src/index';

// Get profile data from any Twitter URL format
const profileData = await getTwitterProfileData('https://twitter.com/hhaider__');

console.log(profileData.name); // "Hamzah Haider"
console.log(profileData.username); // "hhaider__"
console.log(profileData.getFormattedFollowersCount()); // "1.2K"
```

### Supported URL Formats

The library supports various Twitter URL formats:

- `https://twitter.com/username`
- `https://x.com/username`
- `https://twitter.com/username/status/1234567890`
- `https://twitter.com/username/with_replies`
- `@username`
- `username`

### CLI Usage

```bash
# Run with a Twitter URL
npm run dev https://twitter.com/hhaider__

# Run with just a username
npm run dev @hhaider__
```

### Example Output

```json
{
  "id": "1044891241693962240",
  "name": "Hamzah Haider",
  "username": "hhaider__",
  "description": "Programmer, technologia enthusiast, tinkerer | (-27$ ARR)",
  "profileImageUrl": "https://pbs.twimg.com/profile_images/1960402843086561280/6hfeqDR5_normal.jpg",
  "profileBannerUrl": "https://pbs.twimg.com/profile_banners/1044891241693962240/1585009164",
  "verified": false,
  "followersCount": 34,
  "followingCount": 126,
  "tweetCount": 682,
  "formattedFollowersCount": "34",
  "formattedFollowingCount": "126",
  "formattedTweetCount": "682"
}
```

## API Reference

### `getTwitterProfileData(profileUrl: string): Promise<TwitterProfileData>`

Fetches Twitter profile data from a URL.

**Parameters:**
- `profileUrl`: Twitter profile URL or username

**Returns:** `TwitterProfileData` object with profile information

### `TwitterUrlParser`

Utility class for parsing Twitter URLs.

- `extractUsername(url: string): string` - Extract username from URL
- `isValidTwitterUrl(url: string): boolean` - Check if URL is valid
- `normalizeUrl(url: string): string` - Normalize URL to standard format

### `TwitterProfileData`

Dataclass containing Twitter profile information with helper methods:

- `getFormattedFollowersCount(): string` - Format follower count (e.g., "1.2K")
- `getFormattedFollowingCount(): string` - Format following count
- `getFormattedTweetCount(): string` - Format tweet count
- `toJSON(): Record<string, any>` - Convert to plain object

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run in development mode
npm run dev

# Run example
npm run dev src/example.ts
```

## Error Handling

The library provides comprehensive error handling:

- **Invalid URLs**: Clear error messages for malformed URLs
- **API Errors**: Handles rate limits, authentication, and user not found errors
- **Network Errors**: Proper handling of network connectivity issues

## License

MIT
