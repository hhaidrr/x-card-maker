import dotenv from 'dotenv';
import { TwitterUrlParser } from './urlParser';
import { TwitterApiClient } from './twitterApi';
import { TwitterProfileData } from './types';

// Load environment variables
dotenv.config();

/**
 * Main function to get Twitter profile data from a URL
 * @param profileUrl - The Twitter profile URL or username
 * @returns Promise<TwitterProfileData> - The parsed and fetched profile data
 */
export async function getTwitterProfileData(profileUrl: string): Promise<TwitterProfileData> {
  // Validate bearer token
  const bearerToken = process.env.BEARER_TOKEN;
  if (!bearerToken) {
    throw new Error('BEARER_TOKEN environment variable is required. Please set it in your .env file.');
  }

  // Extract username from URL
  const username = TwitterUrlParser.extractUsername(profileUrl);
  console.log(`Extracted username: @${username}`);

  // Create API client
  const apiClient = new TwitterApiClient(bearerToken);

  // Fetch user data
  const profileData = await apiClient.getUserByUsername(username);
  console.log(`Successfully fetched data for @${username}`);

  return profileData;
}

/**
 * CLI function for testing
 */
async function main() {
  try {
    // Check if URL is provided as command line argument
    const profileUrl = process.argv[2];
    
    if (!profileUrl) {
      console.log('Usage: npm run dev <twitter-profile-url>');
      console.log('Example: npm run dev https://twitter.com/hhaider__');
      console.log('Example: npm run dev @hhaider__');
      process.exit(1);
    }

    console.log(`Fetching profile data for: ${profileUrl}`);
    
    const profileData = await getTwitterProfileData(profileUrl);
    
    // Display the results
    console.log('\n=== Twitter Profile Data ===');
    console.log(`Name: ${profileData.name}`);
    console.log(`Username: @${profileData.username}`);
    console.log(`Description: ${profileData.description}`);
    console.log(`Verified: ${profileData.verified ? 'Yes' : 'No'}`);
    console.log(`Followers: ${profileData.getFormattedFollowersCount()}`);
    console.log(`Following: ${profileData.getFormattedFollowingCount()}`);
    console.log(`Tweets: ${profileData.getFormattedTweetCount()}`);
    console.log(`Profile Image: ${profileData.profileImageUrl}`);
    console.log(`Profile Banner: ${profileData.profileBannerUrl}`);
    
    // Output as JSON
    console.log('\n=== JSON Output ===');
    console.log(JSON.stringify(profileData.toJSON(), null, 2));
    
  } catch (error) {
    console.error('Error:', error instanceof Error ? error.message : error);
    process.exit(1);
  }
}

// Run CLI if this file is executed directly
if (require.main === module) {
  main();
}
