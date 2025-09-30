import { getTwitterProfileData } from './index';
import { TwitterUrlParser } from './urlParser';

/**
 * Example usage of the Twitter profile data fetcher
 */
async function runExample() {
  console.log('=== Twitter Profile Data Fetcher Example ===\n');

  // Example URLs to test
  const testUrls = [
    'https://twitter.com/hhaider__',
    'https://x.com/hhaider__',
    '@hhaider__',
    'hhaider__',
    'https://twitter.com/hhaider__/status/1234567890',
    'https://twitter.com/hhaider__/with_replies',
  ];

  console.log('Testing URL parsing:');
  for (const url of testUrls) {
    try {
      const username = TwitterUrlParser.extractUsername(url);
      console.log(`✓ "${url}" -> @${username}`);
    } catch (error) {
      console.log(`✗ "${url}" -> Error: ${error instanceof Error ? error.message : error}`);
    }
  }

  console.log('\n' + '='.repeat(50) + '\n');

  // Test with actual API call (only if BEARER_TOKEN is set)
  if (process.env.BEARER_TOKEN) {
    console.log('Testing API call:');
    try {
      const profileData = await getTwitterProfileData('https://twitter.com/hhaider__');
      
      console.log('\n=== Profile Data Retrieved ===');
      console.log(`Name: ${profileData.name}`);
      console.log(`Username: @${profileData.username}`);
      console.log(`Description: ${profileData.description}`);
      console.log(`Verified: ${profileData.verified ? 'Yes' : 'No'}`);
      console.log(`Followers: ${profileData.getFormattedFollowersCount()}`);
      console.log(`Following: ${profileData.getFormattedFollowingCount()}`);
      console.log(`Tweets: ${profileData.getFormattedTweetCount()}`);
      console.log(`Profile Image: ${profileData.profileImageUrl}`);
      console.log(`Profile Banner: ${profileData.profileBannerUrl}`);
      
      console.log('\n=== Full JSON Data ===');
      console.log(JSON.stringify(profileData.toJSON(), null, 2));
      
    } catch (error) {
      console.log(`✗ API call failed: ${error instanceof Error ? error.message : error}`);
    }
  } else {
    console.log('BEARER_TOKEN not set. Skipping API test.');
    console.log('To test API calls, set your BEARER_TOKEN in a .env file');
  }
}

// Run example if this file is executed directly
if (require.main === module) {
  runExample().catch(console.error);
}
