import * as fs from 'fs-extra';
import * as path from 'path';

/**
 * Folder manager for organizing user data and assets
 */
export class FolderManager {
  private readonly baseDir: string;

  constructor(baseDir: string = './downloads') {
    this.baseDir = baseDir;
  }

  /**
   * Create user directory structure
   * @param username - Twitter username
   * @returns Promise<string> - Path to user directory
   */
  async createUserDirectory(username: string): Promise<string> {
    const userDir = path.join(this.baseDir, username);
    await fs.ensureDir(userDir);
    return userDir;
  }

  /**
   * Get user directory path
   * @param username - Twitter username
   * @returns Path to user directory
   */
  getUserDirectory(username: string): string {
    return path.join(this.baseDir, username);
  }

  /**
   * Check if user directory exists
   * @param username - Twitter username
   * @returns Promise<boolean> - True if directory exists
   */
  async userDirectoryExists(username: string): Promise<boolean> {
    const userDir = this.getUserDirectory(username);
    return await fs.pathExists(userDir);
  }

  /**
   * Get list of all user directories
   * @returns Promise<string[]> - Array of usernames with directories
   */
  async getAllUserDirectories(): Promise<string[]> {
    try {
      const items = await fs.readdir(this.baseDir);
      const userDirs: string[] = [];

      for (const item of items) {
        const itemPath = path.join(this.baseDir, item);
        const stat = await fs.stat(itemPath);
        
        if (stat.isDirectory()) {
          userDirs.push(item);
        }
      }

      return userDirs;
    } catch (error) {
      return [];
    }
  }

  /**
   * Get user directory statistics
   * @param username - Twitter username
   * @returns Promise<UserDirectoryStats> - Directory statistics
   */
  async getUserDirectoryStats(username: string): Promise<UserDirectoryStats> {
    const userDir = this.getUserDirectory(username);
    
    try {
      const items = await fs.readdir(userDir);
      const stats: UserDirectoryStats = {
        username,
        directoryPath: userDir,
        totalFiles: 0,
        totalSize: 0,
        files: [],
        exists: true
      };

      for (const item of items) {
        const itemPath = path.join(userDir, item);
        const stat = await fs.stat(itemPath);
        
        if (stat.isFile()) {
          stats.totalFiles++;
          stats.totalSize += stat.size;
          stats.files.push({
            name: item,
            size: stat.size,
            modified: stat.mtime,
            path: itemPath
          });
        }
      }

      return stats;
    } catch (error) {
      return {
        username,
        directoryPath: userDir,
        totalFiles: 0,
        totalSize: 0,
        files: [],
        exists: false
      };
    }
  }

  /**
   * Clean up user directory (remove old files)
   * @param username - Twitter username
   * @param keepPatterns - File patterns to keep
   * @returns Promise<CleanupResult> - Cleanup results
   */
  async cleanupUserDirectory(
    username: string, 
    keepPatterns: string[] = ['_data.csv', 'profile_image', 'banner_image']
  ): Promise<CleanupResult> {
    const userDir = this.getUserDirectory(username);
    const result: CleanupResult = {
      username,
      filesRemoved: 0,
      spaceFreed: 0,
      errors: []
    };

    try {
      const items = await fs.readdir(userDir);
      
      for (const item of items) {
        const itemPath = path.join(userDir, item);
        const stat = await fs.stat(itemPath);
        
        if (stat.isFile()) {
          const shouldKeep = keepPatterns.some(pattern => item.includes(pattern));
          
          if (!shouldKeep) {
            try {
              result.spaceFreed += stat.size;
              await fs.remove(itemPath);
              result.filesRemoved++;
            } catch (error) {
              result.errors.push(`Failed to remove ${item}: ${error}`);
            }
          }
        }
      }
    } catch (error) {
      result.errors.push(`Failed to cleanup directory: ${error}`);
    }

    return result;
  }

  /**
   * Create a summary of all user directories
   * @returns Promise<DirectorySummary> - Summary of all directories
   */
  async createDirectorySummary(): Promise<DirectorySummary> {
    const userDirs = await this.getAllUserDirectories();
    const summary: DirectorySummary = {
      totalUsers: userDirs.length,
      totalFiles: 0,
      totalSize: 0,
      users: []
    };

    for (const username of userDirs) {
      const stats = await this.getUserDirectoryStats(username);
      summary.totalFiles += stats.totalFiles;
      summary.totalSize += stats.totalSize;
      summary.users.push(stats);
    }

    return summary;
  }

  /**
   * Format file size in human readable format
   * @param bytes - Size in bytes
   * @returns Formatted size string
   */
  formatFileSize(bytes: number): string {
    const units = ['B', 'KB', 'MB', 'GB', 'TB'];
    let size = bytes;
    let unitIndex = 0;

    while (size >= 1024 && unitIndex < units.length - 1) {
      size /= 1024;
      unitIndex++;
    }

    return `${size.toFixed(1)} ${units[unitIndex]}`;
  }
}

/**
 * User directory statistics
 */
export interface UserDirectoryStats {
  username: string;
  directoryPath: string;
  totalFiles: number;
  totalSize: number;
  files: FileInfo[];
  exists: boolean;
}

/**
 * File information
 */
export interface FileInfo {
  name: string;
  size: number;
  modified: Date;
  path: string;
}

/**
 * Cleanup operation result
 */
export interface CleanupResult {
  username: string;
  filesRemoved: number;
  spaceFreed: number;
  errors: string[];
}

/**
 * Directory summary
 */
export interface DirectorySummary {
  totalUsers: number;
  totalFiles: number;
  totalSize: number;
  users: UserDirectoryStats[];
}
