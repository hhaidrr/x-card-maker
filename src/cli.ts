#!/usr/bin/env node

import { Command } from 'commander';
import chalk from 'chalk';
import ora from 'ora';
import * as dotenv from 'dotenv';
import { TwitterUrlParser } from './urlParser';
import { TwitterApiClient } from './twitterApi';
import { AssetDownloader } from './assetDownloader';
import { CSVExporter } from './csvExporter';
import { FolderManager } from './folderManager';
import { ProfileCardGenerator } from './profileCardGenerator';
import { TwitterProfileData, CardGenerationOptions } from './types';

// Load environment variables
dotenv.config();

const program = new Command();

program
  .name('x-card-maker')
  .description('Generate X/Twitter profile cards from profile URLs with asset downloading')
  .version('1.0.0');

// Main command: process a single URL
program
  .command('process')
  .description('Process a single Twitter profile URL')
  .argument('<url>', 'Twitter profile URL or username')
  .option('-o, --output <dir>', 'Output directory', './downloads')
  .option('-t, --token <token>', 'Twitter API Bearer Token (overrides env var)')
  .option('--no-assets', 'Skip downloading assets (images)')
  .option('--no-csv', 'Skip creating CSV file')
  .option('--cleanup', 'Clean up old files in user directory')
  .action(async (url: string, options) => {
    try {
      const spinner = ora('Processing Twitter profile...').start();
      
      // Get bearer token
      const bearerToken = options.token || process.env.BEARER_TOKEN;
      if (!bearerToken) {
        spinner.fail('Error: BEARER_TOKEN environment variable is required');
        process.exit(1);
      }

      // Extract username
      spinner.text = 'Extracting username from URL...';
      const username = TwitterUrlParser.extractUsername(url);
      console.log(chalk.blue(`✓ Extracted username: @${username}`));

      // Fetch profile data
      spinner.text = 'Fetching profile data from Twitter API...';
      const apiClient = new TwitterApiClient(bearerToken);
      const profileData = await apiClient.getUserByUsername(username);
      console.log(chalk.blue(`✓ Fetched data for @${username}`));

      // Create folder structure
      spinner.text = 'Creating folder structure...';
      const folderManager = new FolderManager(options.output);
      const userDir = await folderManager.createUserDirectory(username);
      console.log(chalk.blue(`✓ Created directory: ${userDir}`));

      // Download assets
      if (options.assets !== false) {
        spinner.text = 'Downloading profile assets...';
        const assetDownloader = new AssetDownloader(options.output);
        const downloadResult = await assetDownloader.downloadProfileAssets(profileData);
        
        if (downloadResult.profileImage) {
          console.log(chalk.green(`✓ Downloaded profile image: ${downloadResult.profileImage}`));
        }
        if (downloadResult.bannerImage) {
          console.log(chalk.green(`✓ Downloaded banner image: ${downloadResult.bannerImage}`));
        }
        if (downloadResult.errors.length > 0) {
          console.log(chalk.yellow(`⚠ Download warnings: ${downloadResult.errors.join(', ')}`));
        }
      }

      // Export CSV
      if (options.csv !== false) {
        spinner.text = 'Exporting data to CSV...';
        const csvExporter = new CSVExporter(options.output);
        const csvPath = await csvExporter.exportProfileData(profileData, userDir);
        console.log(chalk.green(`✓ Created CSV file: ${csvPath}`));
      }

      // Cleanup old files
      if (options.cleanup) {
        spinner.text = 'Cleaning up old files...';
        const cleanupResult = await folderManager.cleanupUserDirectory(username);
        if (cleanupResult.filesRemoved > 0) {
          console.log(chalk.blue(`✓ Cleaned up ${cleanupResult.filesRemoved} files, freed ${folderManager.formatFileSize(cleanupResult.spaceFreed)}`));
        }
      }

      spinner.succeed('Profile processing completed successfully!');
      
      // Display summary
      console.log(chalk.bold('\n📊 Profile Summary:'));
      console.log(chalk.white(`  Name: ${profileData.name}`));
      console.log(chalk.white(`  Username: @${profileData.username}`));
      console.log(chalk.white(`  Followers: ${profileData.getFormattedFollowersCount()}`));
      console.log(chalk.white(`  Following: ${profileData.getFormattedFollowingCount()}`));
      console.log(chalk.white(`  Tweets: ${profileData.getFormattedTweetCount()}`));
      console.log(chalk.white(`  Verified: ${profileData.verified ? 'Yes' : 'No'}`));
      console.log(chalk.white(`  Output Directory: ${userDir}`));

    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });

// Batch command: process multiple URLs
program
  .command('batch')
  .description('Process multiple Twitter profile URLs from a file')
  .argument('<file>', 'File containing URLs (one per line)')
  .option('-o, --output <dir>', 'Output directory', './downloads')
  .option('-t, --token <token>', 'Twitter API Bearer Token (overrides env var)')
  .option('--no-assets', 'Skip downloading assets (images)')
  .option('--no-csv', 'Skip creating CSV files')
  .option('--delay <ms>', 'Delay between requests in milliseconds', '1000')
  .action(async (file: string, options) => {
    try {
      const fs = require('fs-extra');
      const urls = (await fs.readFile(file, 'utf8'))
        .split('\n')
        .map((line: string) => line.trim())
        .filter((line: string) => line && !line.startsWith('#'));

      console.log(chalk.blue(`Found ${urls.length} URLs to process`));

      for (let i = 0; i < urls.length; i++) {
        const url = urls[i];
        console.log(chalk.bold(`\n[${i + 1}/${urls.length}] Processing: ${url}`));
        
        try {
          const args = ['node', 'cli.ts', 'process', url];
          for (const [key, value] of Object.entries(options)) {
            if (value !== undefined && value !== null) {
              args.push(`--${key}`, String(value));
            }
          }
          await program.parseAsync(args);
        } catch (error) {
          console.error(chalk.red(`Failed to process ${url}: ${error}`));
        }

        // Add delay between requests
        if (i < urls.length - 1) {
          await new Promise(resolve => setTimeout(resolve, parseInt(options.delay)));
        }
      }

      console.log(chalk.green('\n✅ Batch processing completed!'));
    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });

// List command: show all processed profiles
program
  .command('list')
  .description('List all processed profiles')
  .option('-o, --output <dir>', 'Output directory', './downloads')
  .option('--summary', 'Show detailed summary')
  .action(async (options) => {
    try {
      const folderManager = new FolderManager(options.output);
      const summary = await folderManager.createDirectorySummary();

      console.log(chalk.bold(`\n📁 Processed Profiles (${summary.totalUsers} total)`));
      console.log(chalk.gray(`Total files: ${summary.totalFiles}`));
      console.log(chalk.gray(`Total size: ${folderManager.formatFileSize(summary.totalSize)}`));
      console.log(chalk.gray(`Output directory: ${options.output}`));

      if (options.summary) {
        console.log(chalk.bold('\n📊 Detailed Summary:'));
        for (const user of summary.users) {
          console.log(chalk.white(`\n  @${user.username}:`));
          console.log(chalk.gray(`    Directory: ${user.directoryPath}`));
          console.log(chalk.gray(`    Files: ${user.totalFiles}`));
          console.log(chalk.gray(`    Size: ${folderManager.formatFileSize(user.totalSize)}`));
          
          if (user.files.length > 0) {
            console.log(chalk.gray(`    Files:`));
            for (const file of user.files) {
              console.log(chalk.gray(`      - ${file.name} (${folderManager.formatFileSize(file.size)})`));
            }
          }
        }
      } else {
        console.log(chalk.bold('\n👥 Users:'));
        for (const user of summary.users) {
          console.log(chalk.white(`  @${user.username} (${user.totalFiles} files, ${folderManager.formatFileSize(user.totalSize)})`));
        }
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });

// Cleanup command: clean up old files
program
  .command('cleanup')
  .description('Clean up old files in user directories')
  .option('-o, --output <dir>', 'Output directory', './downloads')
  .option('-u, --user <username>', 'Clean up specific user directory')
  .option('--dry-run', 'Show what would be cleaned up without actually doing it')
  .action(async (options) => {
    try {
      const folderManager = new FolderManager(options.output);
      
      if (options.user) {
        // Clean up specific user
        const stats = await folderManager.getUserDirectoryStats(options.user);
        if (!stats.exists) {
          console.log(chalk.red(`User directory not found: @${options.user}`));
          return;
        }

        if (options.dryRun) {
          console.log(chalk.yellow(`Would clean up @${options.user} directory:`));
          console.log(chalk.gray(`  Files: ${stats.totalFiles}`));
          console.log(chalk.gray(`  Size: ${folderManager.formatFileSize(stats.totalSize)}`));
        } else {
          const result = await folderManager.cleanupUserDirectory(options.user);
          console.log(chalk.green(`Cleaned up @${options.user}:`));
          console.log(chalk.gray(`  Files removed: ${result.filesRemoved}`));
          console.log(chalk.gray(`  Space freed: ${folderManager.formatFileSize(result.spaceFreed)}`));
        }
      } else {
        // Clean up all users
        const users = await folderManager.getAllUserDirectories();
        let totalFilesRemoved = 0;
        let totalSpaceFreed = 0;

        for (const username of users) {
          if (options.dryRun) {
            const stats = await folderManager.getUserDirectoryStats(username);
            console.log(chalk.yellow(`Would clean up @${username}: ${stats.totalFiles} files, ${folderManager.formatFileSize(stats.totalSize)}`));
          } else {
            const result = await folderManager.cleanupUserDirectory(username);
            totalFilesRemoved += result.filesRemoved;
            totalSpaceFreed += result.spaceFreed;
            if (result.filesRemoved > 0) {
              console.log(chalk.green(`Cleaned up @${username}: ${result.filesRemoved} files, ${folderManager.formatFileSize(result.spaceFreed)}`));
            }
          }
        }

        if (!options.dryRun) {
          console.log(chalk.bold(`\n✅ Total cleanup results:`));
          console.log(chalk.gray(`  Files removed: ${totalFilesRemoved}`));
          console.log(chalk.gray(`  Space freed: ${folderManager.formatFileSize(totalSpaceFreed)}`));
        }
      }
    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });

// Master CSV command: create master CSV with all profiles
program
  .command('master-csv')
  .description('Create a master CSV file with all processed profiles')
  .option('-o, --output <dir>', 'Output directory', './downloads')
  .action(async (options) => {
    try {
      const csvExporter = new CSVExporter(options.output);
      const masterCsvPath = await csvExporter.createMasterCSV(options.output);
      console.log(chalk.green(`✓ Created master CSV: ${masterCsvPath}`));
    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });

// Card generation command: generate profile cards from stored data
program
  .command('generate-card')
  .description('Generate a profile card from stored user data')
  .argument('<username>', 'Twitter username to generate card for')
  .option('-o, --output <dir>', 'Downloads directory', './downloads')
  .option('-w, --width <pixels>', 'Card width in pixels', '1200')
  .option('-h, --height <pixels>', 'Card height in pixels', '630')
  .option('-s, --style <style>', 'Card style (modern, classic, minimal)', 'modern')
  .option('-f, --format <format>', 'Output format (png, jpeg)', 'png')
  .option('--no-banner', 'Hide banner image')
  .option('--no-stats', 'Hide statistics')
  .option('--no-description', 'Hide description')
  .option('--bg-color <color>', 'Background color (hex)', '#000000')
  .option('--text-color <color>', 'Text color (hex)', '#ffffff')
  .option('--accent-color <color>', 'Accent color (hex)', '#1d9bf0')
  .action(async (username: string, options) => {
    try {
      const spinner = ora('Generating profile card...').start();
      
      // Load assets from directory
      spinner.text = 'Loading profile data and assets...';
      const cardGenerator = new ProfileCardGenerator();
      const assets = await cardGenerator.loadAssetsFromDirectory(username, options.output);
      console.log(chalk.blue(`✓ Loaded data for @${username}`));
      
      // Prepare generation options
      const cardOptions: CardGenerationOptions = {
        width: parseInt(options.width),
        height: parseInt(options.height),
        cardStyle: options.style,
        outputFormat: options.format,
        showBanner: options.banner !== false,
        showStats: options.stats !== false,
        showDescription: options.description !== false,
        backgroundColor: options.bgColor,
        textColor: options.textColor,
        accentColor: options.accentColor
      };
      
      // Generate card
      spinner.text = 'Generating profile card...';
      const result = await cardGenerator.generateCard(assets, cardOptions);
      
      if (result.success) {
        spinner.succeed('Profile card generated successfully!');
        console.log(chalk.green(`✓ Card saved: ${result.outputPath}`));
        
        if (result.cardInfo) {
          console.log(chalk.blue(`  Dimensions: ${result.cardInfo.width}x${result.cardInfo.height}`));
          console.log(chalk.blue(`  Format: ${result.cardInfo.format}`));
          console.log(chalk.blue(`  File size: ${Math.round(result.cardInfo.fileSize / 1024)}KB`));
        }
      } else {
        spinner.fail('Failed to generate profile card');
        console.error(chalk.red(`Error: ${result.error}`));
        process.exit(1);
      }
      
    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });

// Batch card generation command: generate cards for all users
program
  .command('generate-cards')
  .description('Generate profile cards for all processed users')
  .option('-o, --output <dir>', 'Downloads directory', './downloads')
  .option('-w, --width <pixels>', 'Card width in pixels', '1200')
  .option('-h, --height <pixels>', 'Card height in pixels', '630')
  .option('-s, --style <style>', 'Card style (modern, classic, minimal)', 'modern')
  .option('-f, --format <format>', 'Output format (png, jpeg)', 'png')
  .option('--no-banner', 'Hide banner image')
  .option('--no-stats', 'Hide statistics')
  .option('--no-description', 'Hide description')
  .option('--bg-color <color>', 'Background color (hex)', '#000000')
  .option('--text-color <color>', 'Text color (hex)', '#ffffff')
  .option('--accent-color <color>', 'Accent color (hex)', '#1d9bf0')
  .action(async (options) => {
    try {
      const folderManager = new FolderManager(options.output);
      const users = await folderManager.getAllUserDirectories();
      
      if (users.length === 0) {
        console.log(chalk.yellow('No processed users found. Run "process" command first.'));
        return;
      }
      
      console.log(chalk.blue(`Found ${users.length} users to generate cards for`));
      
      const cardGenerator = new ProfileCardGenerator();
      let successCount = 0;
      let failCount = 0;
      
      for (let i = 0; i < users.length; i++) {
        const username = users[i];
        console.log(chalk.bold(`\n[${i + 1}/${users.length}] Generating card for @${username}`));
        
        try {
          const spinner = ora(`Generating card for @${username}...`).start();
          
          // Load assets
          const assets = await cardGenerator.loadAssetsFromDirectory(username, options.output);
          
          // Prepare generation options
          const cardOptions: CardGenerationOptions = {
            width: parseInt(options.width),
            height: parseInt(options.height),
            cardStyle: options.style,
            outputFormat: options.format,
            showBanner: options.banner !== false,
            showStats: options.stats !== false,
            showDescription: options.description !== false,
            backgroundColor: options.bgColor,
            textColor: options.textColor,
            accentColor: options.accentColor
          };
          
          // Generate card
          const result = await cardGenerator.generateCard(assets, cardOptions);
          
          if (result.success) {
            spinner.succeed(`Card generated for @${username}`);
            console.log(chalk.green(`  Saved: ${result.outputPath}`));
            successCount++;
          } else {
            spinner.fail(`Failed to generate card for @${username}`);
            console.error(chalk.red(`  Error: ${result.error}`));
            failCount++;
          }
          
        } catch (error) {
          console.error(chalk.red(`Failed to generate card for @${username}: ${error}`));
          failCount++;
        }
      }
      
      console.log(chalk.bold(`\n✅ Card generation completed!`));
      console.log(chalk.green(`  Success: ${successCount}`));
      if (failCount > 0) {
        console.log(chalk.red(`  Failed: ${failCount}`));
      }
      
    } catch (error) {
      console.error(chalk.red(`Error: ${error}`));
      process.exit(1);
    }
  });

// Parse command line arguments
program.parse();
