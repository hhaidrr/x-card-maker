import axios from 'axios';
import * as fs from 'fs-extra';
import * as path from 'path';
import { TwitterProfileData } from './types';

/**
 * Asset downloader for Twitter profile images and banners
 */
export class AssetDownloader {
  private readonly outputDir: string;

  constructor(outputDir: string = './downloads') {
    this.outputDir = outputDir;
  }

  /**
   * Download all assets for a Twitter profile
   * @param profileData - The Twitter profile data
   * @returns Promise<AssetDownloadResult> - Download results
   */
  async downloadProfileAssets(profileData: TwitterProfileData): Promise<AssetDownloadResult> {
    const username = profileData.username;
    const userDir = path.join(this.outputDir, username);
    
    // Ensure user directory exists
    await fs.ensureDir(userDir);

    const results: AssetDownloadResult = {
      username,
      userDir,
      profileImage: null,
      bannerImage: null,
      errors: []
    };

    // Download profile image
    if (profileData.profileImageUrl) {
      try {
        const profileImagePath = await this.downloadImage(
          profileData.profileImageUrl,
          userDir,
          'profile_image'
        );
        results.profileImage = profileImagePath;
      } catch (error) {
        results.errors.push(`Failed to download profile image: ${error}`);
      }
    }

    // Download banner image
    if (profileData.profileBannerUrl) {
      try {
        const bannerImagePath = await this.downloadImage(
          profileData.profileBannerUrl,
          userDir,
          'banner_image'
        );
        results.bannerImage = bannerImagePath;
      } catch (error) {
        results.errors.push(`Failed to download banner image: ${error}`);
      }
    }

    return results;
  }

  /**
   * Download a single image
   * @param imageUrl - URL of the image to download
   * @param outputDir - Directory to save the image
   * @param filename - Base filename (without extension)
   * @returns Promise<string> - Path to the downloaded file
   */
  private async downloadImage(
    imageUrl: string,
    outputDir: string,
    filename: string
  ): Promise<string> {
    try {
      // Get the image
      const response = await axios.get(imageUrl, {
        responseType: 'arraybuffer',
        timeout: 30000, // 30 second timeout
        headers: {
          'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/91.0.4472.124 Safari/537.36'
        }
      });

      // Determine file extension from content type or URL
      const contentType = response.headers['content-type'];
      let extension = this.getExtensionFromContentType(contentType) || 
                     this.getExtensionFromUrl(imageUrl) || 
                     '.jpg';

      // Create filename
      const fullFilename = `${filename}${extension}`;
      const filePath = path.join(outputDir, fullFilename);

      // Write file
      await fs.writeFile(filePath, response.data);

      return filePath;
    } catch (error) {
      throw new Error(`Failed to download image from ${imageUrl}: ${error}`);
    }
  }

  /**
   * Get file extension from content type
   * @param contentType - MIME content type
   * @returns File extension or null
   */
  private getExtensionFromContentType(contentType: string): string | null {
    const typeMap: { [key: string]: string } = {
      'image/jpeg': '.jpg',
      'image/jpg': '.jpg',
      'image/png': '.png',
      'image/gif': '.gif',
      'image/webp': '.webp',
      'image/svg+xml': '.svg'
    };

    return typeMap[contentType?.toLowerCase()] || null;
  }

  /**
   * Get file extension from URL
   * @param url - Image URL
   * @returns File extension or null
   */
  private getExtensionFromUrl(url: string): string | null {
    const match = url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i);
    return match ? `.${match[1].toLowerCase()}` : null;
  }

  /**
   * Clean up old files in user directory (optional)
   * @param userDir - User directory path
   * @param keepFiles - Files to keep (by pattern)
   */
  async cleanupOldFiles(userDir: string, keepFiles: string[] = []): Promise<void> {
    try {
      const files = await fs.readdir(userDir);
      
      for (const file of files) {
        const filePath = path.join(userDir, file);
        const stat = await fs.stat(filePath);
        
        if (stat.isFile()) {
          const shouldKeep = keepFiles.some(pattern => file.includes(pattern));
          if (!shouldKeep) {
            await fs.remove(filePath);
          }
        }
      }
    } catch (error) {
      console.warn(`Warning: Could not cleanup old files in ${userDir}: ${error}`);
    }
  }
}

/**
 * Result of asset download operation
 */
export interface AssetDownloadResult {
  username: string;
  userDir: string;
  profileImage: string | null;
  bannerImage: string | null;
  errors: string[];
}
