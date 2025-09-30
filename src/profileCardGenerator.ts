import { createCanvas, loadImage, Canvas, CanvasRenderingContext2D } from 'canvas';
import * as fs from 'fs-extra';
import * as path from 'path';
import { TwitterProfileData, CardGenerationOptions, CardGenerationResult, CardAssets } from './types';

/**
 * Profile card generator using node-canvas
 */
export class ProfileCardGenerator {
  private readonly defaultOptions: Required<CardGenerationOptions> = {
    width: 1200,
    height: 630,
    backgroundColor: '#000000',
    textColor: '#ffffff',
    accentColor: '#1d9bf0',
    fontFamily: 'Arial, sans-serif',
    showBanner: true,
    showStats: true,
    showDescription: true,
    cardStyle: 'modern',
    outputFormat: 'png',
    quality: 90
  };

  /**
   * Generate a profile card from stored assets and data
   * @param assets - Profile assets and data
   * @param options - Card generation options
   * @param outputPath - Output file path
   * @returns Promise<CardGenerationResult> - Generation result
   */
  async generateCard(
    assets: CardAssets,
    options: CardGenerationOptions = {},
    outputPath?: string
  ): Promise<CardGenerationResult> {
    try {
      const opts = { ...this.defaultOptions, ...options };
      
      // Create canvas
      const canvas = createCanvas(opts.width, opts.height);
      const ctx = canvas.getContext('2d');
      
      // Set up canvas
      this.setupCanvas(ctx, opts);
      
      // Draw background
      this.drawBackground(ctx, opts);
      
      // Load and draw banner if available
      if (opts.showBanner && assets.bannerImagePath) {
        await this.drawBanner(ctx, assets.bannerImagePath, opts);
      }
      
      // Load and draw profile image
      if (assets.profileImagePath) {
        await this.drawProfileImage(ctx, assets.profileImagePath, opts);
      }
      
      // Draw profile information
      this.drawProfileInfo(ctx, assets.profileData, opts);
      
      // Draw stats if enabled
      if (opts.showStats) {
        this.drawStats(ctx, assets.profileData, opts);
      }
      
      // Draw description if enabled
      if (opts.showDescription && assets.profileData.description) {
        this.drawDescription(ctx, assets.profileData.description, opts);
      }
      
      // Generate output path if not provided
      if (!outputPath) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const extension = opts.outputFormat === 'jpeg' ? 'jpg' : 'png';
        const filename = `${assets.profileData.username}_card_${timestamp}.${extension}`;
        outputPath = path.join(process.cwd(), 'downloads', assets.profileData.username, filename);
      }
      
      // Ensure output directory exists
      await fs.ensureDir(path.dirname(outputPath));
      
      // Save the card
      const buffer = canvas.toBuffer();
      await fs.writeFile(outputPath, buffer);
      
      const stats = await fs.stat(outputPath);
      
      return {
        success: true,
        outputPath,
        cardInfo: {
          width: opts.width,
          height: opts.height,
          fileSize: stats.size,
          format: opts.outputFormat.toUpperCase()
        }
      };
      
    } catch (error) {
      return {
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error occurred'
      };
    }
  }

  /**
   * Set up canvas with basic properties
   */
  private setupCanvas(ctx: CanvasRenderingContext2D, options: Required<CardGenerationOptions>): void {
    ctx.antialias = 'default';
    ctx.textAlign = 'left';
    ctx.textBaseline = 'top';
  }

  /**
   * Draw card background
   */
  private drawBackground(ctx: CanvasRenderingContext2D, options: Required<CardGenerationOptions>): void {
    ctx.fillStyle = options.backgroundColor;
    ctx.fillRect(0, 0, options.width, options.height);
  }

  /**
   * Draw banner image
   */
  private async drawBanner(
    ctx: CanvasRenderingContext2D, 
    bannerPath: string, 
    options: Required<CardGenerationOptions>
  ): Promise<void> {
    try {
      const bannerImage = await loadImage(bannerPath);
      const bannerHeight = Math.floor(options.height * 0.4);
      
      // Calculate dimensions to maintain aspect ratio
      const aspectRatio = bannerImage.width / bannerImage.height;
      const bannerWidth = bannerHeight * aspectRatio;
      
      // Center the banner horizontally
      const x = (options.width - bannerWidth) / 2;
      
      ctx.drawImage(bannerImage, x, 0, bannerWidth, bannerHeight);
      
      // Add overlay for better text readability
      const overlay = ctx.createLinearGradient(0, 0, 0, bannerHeight);
      overlay.addColorStop(0, 'rgba(0, 0, 0, 0.3)');
      overlay.addColorStop(1, 'rgba(0, 0, 0, 0.7)');
      ctx.fillStyle = overlay;
      ctx.fillRect(0, 0, options.width, bannerHeight);
      
    } catch (error) {
      console.warn('Failed to load banner image:', error);
    }
  }

  /**
   * Draw profile image
   */
  private async drawProfileImage(
    ctx: CanvasRenderingContext2D, 
    profilePath: string, 
    options: Required<CardGenerationOptions>
  ): Promise<void> {
    try {
      const profileImage = await loadImage(profilePath);
      const profileSize = 120;
      const x = 60;
      const y = options.showBanner ? Math.floor(options.height * 0.4) - profileSize / 2 : 60;
      
      // Draw circular profile image
      ctx.save();
      ctx.beginPath();
      ctx.arc(x + profileSize / 2, y + profileSize / 2, profileSize / 2, 0, Math.PI * 2);
      ctx.clip();
      ctx.drawImage(profileImage, x, y, profileSize, profileSize);
      ctx.restore();
      
      // Draw border
      ctx.strokeStyle = options.backgroundColor;
      ctx.lineWidth = 4;
      ctx.beginPath();
      ctx.arc(x + profileSize / 2, y + profileSize / 2, profileSize / 2, 0, Math.PI * 2);
      ctx.stroke();
      
    } catch (error) {
      console.warn('Failed to load profile image:', error);
    }
  }

  /**
   * Draw profile information (name, username, verification)
   */
  private drawProfileInfo(
    ctx: CanvasRenderingContext2D, 
    profileData: TwitterProfileData, 
    options: Required<CardGenerationOptions>
  ): void {
    const startY = options.showBanner ? Math.floor(options.height * 0.4) + 20 : 200;
    const x = 60;
    let currentY = startY;
    
    // Name
    ctx.fillStyle = options.textColor;
    ctx.font = `bold 36px ${options.fontFamily}`;
    ctx.fillText(profileData.name, x, currentY);
    currentY += 50;
    
    // Username with @ symbol
    ctx.fillStyle = '#71767b';
    ctx.font = `28px ${options.fontFamily}`;
    ctx.fillText(`@${profileData.username}`, x, currentY);
    currentY += 40;
    
    // Verification badge
    if (profileData.verified) {
      ctx.fillStyle = options.accentColor;
      ctx.font = `24px ${options.fontFamily}`;
      ctx.fillText('✓ Verified', x, currentY);
      currentY += 40;
    }
  }

  /**
   * Draw profile statistics
   */
  private drawStats(
    ctx: CanvasRenderingContext2D, 
    profileData: TwitterProfileData, 
    options: Required<CardGenerationOptions>
  ): void {
    const startY = options.showBanner ? Math.floor(options.height * 0.4) + 200 : 400;
    const x = 60;
    const spacing = 120;
    let currentX = x;
    
    ctx.fillStyle = options.textColor;
    ctx.font = `bold 24px ${options.fontFamily}`;
    
    // Followers
    ctx.fillText(profileData.getFormattedFollowersCount(), currentX, startY);
    ctx.fillStyle = '#71767b';
    ctx.font = `18px ${options.fontFamily}`;
    ctx.fillText('Followers', currentX, startY + 30);
    currentX += spacing;
    
    // Following
    ctx.fillStyle = options.textColor;
    ctx.font = `bold 24px ${options.fontFamily}`;
    ctx.fillText(profileData.getFormattedFollowingCount(), currentX, startY);
    ctx.fillStyle = '#71767b';
    ctx.font = `18px ${options.fontFamily}`;
    ctx.fillText('Following', currentX, startY + 30);
    currentX += spacing;
    
    // Tweets
    ctx.fillStyle = options.textColor;
    ctx.font = `bold 24px ${options.fontFamily}`;
    ctx.fillText(profileData.getFormattedTweetCount(), currentX, startY);
    ctx.fillStyle = '#71767b';
    ctx.font = `18px ${options.fontFamily}`;
    ctx.fillText('Tweets', currentX, startY + 30);
  }

  /**
   * Draw profile description
   */
  private drawDescription(
    ctx: CanvasRenderingContext2D, 
    description: string, 
    options: Required<CardGenerationOptions>
  ): void {
    const startY = options.showBanner ? Math.floor(options.height * 0.4) + 300 : 500;
    const x = 60;
    const maxWidth = options.width - 120;
    
    ctx.fillStyle = options.textColor;
    ctx.font = `20px ${options.fontFamily}`;
    
    // Wrap text
    const words = description.split(' ');
    let line = '';
    let currentY = startY;
    const lineHeight = 30;
    
    for (const word of words) {
      const testLine = line + word + ' ';
      const metrics = ctx.measureText(testLine);
      
      if (metrics.width > maxWidth && line !== '') {
        ctx.fillText(line, x, currentY);
        line = word + ' ';
        currentY += lineHeight;
      } else {
        line = testLine;
      }
    }
    
    if (line) {
      ctx.fillText(line, x, currentY);
    }
  }

  /**
   * Load assets from user directory
   * @param username - Twitter username
   * @param downloadsDir - Downloads directory path
   * @returns Promise<CardAssets> - Loaded assets
   */
  async loadAssetsFromDirectory(username: string, downloadsDir: string = './downloads'): Promise<CardAssets> {
    const userDir = path.join(downloadsDir, username);
    const profileImagePath = path.join(userDir, 'profile_image.jpg');
    const bannerImagePath = path.join(userDir, 'banner_image.jpg');
    const dataPath = path.join(userDir, `${username}_data.csv`);
    
    // Load profile data from CSV
    let profileData: TwitterProfileData;
    try {
      const csvContent = await fs.readFile(dataPath, 'utf-8');
      const lines = csvContent.split('\n');
      const headers = lines[0].split(',');
      const data = lines[1].split(',');
      
      // Create a mock TwitterUser object from CSV data
      const mockUser = {
        id: data[0] || '',
        name: data[1] || '',
        username: data[2] || '',
        description: data[3] || '',
        profile_image_url: data[13] || '',
        profile_banner_url: data[14] || '',
        verified: data[4] === 'true',
        public_metrics: {
          followers_count: parseInt(data[5]) || 0,
          following_count: parseInt(data[6]) || 0,
          tweet_count: parseInt(data[7]) || 0,
          listed_count: parseInt(data[8]) || 0,
          like_count: parseInt(data[9]) || 0,
          media_count: parseInt(data[10]) || 0
        },
        subscription: {
          subscribes_to_you: data[11] === 'true'
        },
        subscription_type: data[12] || ''
      };
      
      profileData = new TwitterProfileData(mockUser);
    } catch (error) {
      throw new Error(`Failed to load profile data for ${username}: ${error}`);
    }
    
    // Check if asset files exist
    const assets: CardAssets = {
      profileData
    };
    
    if (await fs.pathExists(profileImagePath)) {
      assets.profileImagePath = profileImagePath;
    }
    
    if (await fs.pathExists(bannerImagePath)) {
      assets.bannerImagePath = bannerImagePath;
    }
    
    return assets;
  }
}
