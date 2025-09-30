# X Card Maker

A powerful Node.js TypeScript CLI tool that processes Twitter/X profile URLs, downloads assets, and organizes data into structured folders with CSV exports.

## Features

- 🔗 **URL Parsing**: Extract usernames from various Twitter URL formats
- 🐦 **Twitter API Integration**: Fetch comprehensive profile data using Twitter API v2
- 📸 **Asset Downloading**: Download profile images and banner images
- 📊 **CSV Export**: Export profile data to CSV files
- 📁 **Folder Organization**: Organize data by username in structured folders
- 🎨 **Profile Card Generation**: Generate beautiful X/Twitter-style profile cards using node-canvas
- 🖼️ **Customizable Cards**: Customize card dimensions, colors, styles, and content
- 📱 **Multiple Formats**: Export cards as PNG or JPEG images
- 🎯 **Type Safety**: Full TypeScript support with proper interfaces
- 🛡️ **Error Handling**: Comprehensive error handling for all operations
- 🚀 **CLI Interface**: Easy-to-use command-line interface

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

### CLI Commands

#### Process a Single Profile

```bash
# Process a single Twitter profile
npx ts-node src/cli.ts process https://twitter.com/hhaider__

# Process with custom output directory
npx ts-node src/cli.ts process https://twitter.com/hhaider__ --output ./my-profiles

# Process without downloading assets
npx ts-node src/cli.ts process https://twitter.com/hhaider__ --no-assets

# Process without CSV export
npx ts-node src/cli.ts process https://twitter.com/hhaider__ --no-csv

# Process with cleanup of old files
npx ts-node src/cli.ts process https://twitter.com/hhaider__ --cleanup
```

#### Batch Processing

```bash
# Process multiple URLs from a file
npx ts-node src/cli.ts batch urls.txt

# Process with custom delay between requests
npx ts-node src/cli.ts batch urls.txt --delay 2000
```

#### List Processed Profiles

```bash
# List all processed profiles
npx ts-node src/cli.ts list

# Show detailed summary
npx ts-node src/cli.ts list --summary
```

#### Profile Card Generation

```bash
# Generate a profile card for a specific user
npx ts-node src/cli.ts generate-card hhaider__

# Generate card with custom dimensions and style
npx ts-node src/cli.ts generate-card hhaider__ --width 800 --height 400 --style modern

# Generate card without banner or stats
npx ts-node src/cli.ts generate-card hhaider__ --no-banner --no-stats

# Generate card with custom colors
npx ts-node src/cli.ts generate-card hhaider__ --bg-color "#1a1a1a" --text-color "#ffffff" --accent-color "#00ff00"

# Generate cards for all processed users
npx ts-node src/cli.ts generate-cards

# Generate cards with specific format and style
npx ts-node src/cli.ts generate-cards --format jpeg --style minimal
```

#### Cleanup Operations

```bash
# Clean up old files in all user directories
npx ts-node src/cli.ts cleanup

# Clean up specific user directory
npx ts-node src/cli.ts cleanup --user hhaider__

# Dry run to see what would be cleaned up
npx ts-node src/cli.ts cleanup --dry-run
```

#### Master CSV

```bash
# Create a master CSV with all processed profiles
npx ts-node src/cli.ts master-csv
```

### Supported URL Formats

The tool supports various Twitter URL formats:

- `https://twitter.com/username`
- `https://x.com/username`
- `https://twitter.com/username/status/1234567890`
- `https://twitter.com/username/with_replies`
- `@username`
- `username`

### Output Structure

For each processed profile, the tool creates:

```
downloads/
├── username/
│   ├── profile_image.jpg          # Downloaded profile image
│   ├── banner_image.jpg           # Downloaded banner image
│   └── username_data.csv          # Profile data in CSV format
└── all_profiles.csv               # Master CSV with all profiles
```

### CSV Data Fields

The CSV files contain the following fields:

- `id` - Twitter user ID
- `name` - Display name
- `username` - Username (without @)
- `description` - Bio/description
- `verified` - Verification status
- `followers_count` - Number of followers
- `following_count` - Number of following
- `tweet_count` - Number of tweets
- `listed_count` - Number of lists
- `like_count` - Number of likes
- `media_count` - Number of media
- `subscribes_to_you` - Subscription status
- `subscription_type` - Subscription type
- `profile_image_url` - Profile image URL
- `profile_banner_url` - Banner image URL
- `created_at` - Processing timestamp

## Programmatic Usage

```typescript
import { processTwitterProfile } from './src/index';

// Process a profile programmatically
const result = await processTwitterProfile('https://twitter.com/hhaider__', {
  outputDir: './my-profiles',
  downloadAssets: true,
  exportCSV: true,
  cleanup: false
});

console.log(`Processed @${result.username}`);
console.log(`Profile data:`, result.profileData);
console.log(`Assets:`, result.assets);
console.log(`CSV path:`, result.csvPath);
```

## Development

```bash
# Install dependencies
npm install

# Build TypeScript
npm run build

# Run CLI in development mode
npm run cli process https://twitter.com/hhaider__

# Run tests
npm test

# Run tests with coverage
npm run test:coverage
```

## Error Handling

The tool provides comprehensive error handling:

- **Invalid URLs**: Clear error messages for malformed URLs
- **API Errors**: Handles rate limits, authentication, and user not found errors
- **Network Errors**: Proper handling of network connectivity issues
- **File System Errors**: Graceful handling of file operations
- **Asset Download Errors**: Continues processing even if some assets fail to download

## License

MIT
