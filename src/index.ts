/**
 * Main entry point for X Card Maker
 */

import dotenv from 'dotenv';
import { TwitterUrlParser } from './urlParser';
import { TwitterApiClient } from './twitterApi';
import { AssetDownloader } from './assetDownloader';
import { CSVExporter } from './csvExporter';
import { FolderManager } from './folderManager';
import { TwitterProfileData } from './types';

// Load environment variables
dotenv.config();

/**
 * Main function to process a Twitter profile URL
 * @param profileUrl - The Twitter profile URL or username
 * @param options - Processing options
 * @returns Promise<ProcessingResult> - Processing results
 */
export async function processTwitterProfile(
  profileUrl: string,
  options: ProcessingOptions = {}
): Promise<ProcessingResult> {
  const {
    bearerToken = process.env.BEARER_TOKEN,
    outputDir = './downloads',
    downloadAssets = true,
    exportCSV = true,
    cleanup = false
  } = options;

  if (!bearerToken) {
    throw new Error('BEARER_TOKEN environment variable is required');
  }

  // Extract username from URL
  const username = TwitterUrlParser.extractUsername(profileUrl);
  console.log(`Extracted username: @${username}`);

  // Create folder structure
  const folderManager = new FolderManager(outputDir);
  const userDir = await folderManager.createUserDirectory(username);

  // Fetch profile data
  const apiClient = new TwitterApiClient(bearerToken);
  const profileData = await apiClient.getUserByUsername(username);
  console.log(`Successfully fetched data for @${username}`);

  const result: ProcessingResult = {
    username,
    userDir,
    profileData,
    assets: null,
    csvPath: null,
    errors: []
  };

  // Download assets
  if (downloadAssets) {
    try {
      const assetDownloader = new AssetDownloader(outputDir);
      const downloadResult = await assetDownloader.downloadProfileAssets(profileData);
      result.assets = downloadResult;
      
      if (downloadResult.errors.length > 0) {
        result.errors.push(...downloadResult.errors);
      }
    } catch (error) {
      result.errors.push(`Failed to download assets: ${error}`);
    }
  }

  // Export CSV
  if (exportCSV) {
    try {
      const csvExporter = new CSVExporter(outputDir);
      const csvPath = await csvExporter.exportProfileData(profileData, userDir);
      result.csvPath = csvPath;
    } catch (error) {
      result.errors.push(`Failed to export CSV: ${error}`);
    }
  }

  // Cleanup old files
  if (cleanup) {
    try {
      await folderManager.cleanupUserDirectory(username);
    } catch (error) {
      result.errors.push(`Failed to cleanup: ${error}`);
    }
  }

  return result;
}

/**
 * Processing options
 */
export interface ProcessingOptions {
  bearerToken?: string;
  outputDir?: string;
  downloadAssets?: boolean;
  exportCSV?: boolean;
  cleanup?: boolean;
}

/**
 * Processing result
 */
export interface ProcessingResult {
  username: string;
  userDir: string;
  profileData: TwitterProfileData;
  assets: AssetDownloadResult | null;
  csvPath: string | null;
  errors: string[];
}

/**
 * Asset download result (re-exported from assetDownloader)
 */
export interface AssetDownloadResult {
  username: string;
  userDir: string;
  profileImage: string | null;
  bannerImage: string | null;
  errors: string[];
}

// Re-export all modules for external use
export * from './types';
export * from './urlParser';
export * from './twitterApi';
export * from './assetDownloader';
export * from './csvExporter';
export * from './folderManager';