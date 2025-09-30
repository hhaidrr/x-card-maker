import * as fs from 'fs-extra';
import * as path from 'path';
import { TwitterProfileData } from './types';

/**
 * CSV exporter for Twitter profile data
 */
export class CSVExporter {
  private readonly outputDir: string;

  constructor(outputDir: string = './downloads') {
    this.outputDir = outputDir;
  }

  /**
   * Export profile data to CSV
   * @param profileData - The Twitter profile data
   * @param userDir - User directory path
   * @returns Promise<string> - Path to the created CSV file
   */
  async exportProfileData(profileData: TwitterProfileData, userDir: string): Promise<string> {
    const csvPath = path.join(userDir, `${profileData.username}_data.csv`);
    
    // Convert profile data to CSV row
    const csvData = profileData.toCSVRow();
    
    // Create CSV content
    const csvContent = this.createCSVContent([csvData]);
    
    // Write CSV file
    await fs.writeFile(csvPath, csvContent, 'utf8');
    
    return csvPath;
  }

  /**
   * Append profile data to existing CSV file
   * @param profileData - The Twitter profile data
   * @param csvPath - Path to existing CSV file
   * @returns Promise<void>
   */
  async appendProfileData(profileData: TwitterProfileData, csvPath: string): Promise<void> {
    const csvData = profileData.toCSVRow();
    
    // Check if file exists
    const fileExists = await fs.pathExists(csvPath);
    
    if (fileExists) {
      // Read existing content
      const existingContent = await fs.readFile(csvPath, 'utf8');
      const lines = existingContent.trim().split('\n');
      
      // Add new row (without header)
      const newRow = this.objectToCSVRow(csvData);
      lines.push(newRow);
      
      // Write back to file
      await fs.writeFile(csvPath, lines.join('\n') + '\n', 'utf8');
    } else {
      // Create new file
      const csvContent = this.createCSVContent([csvData]);
      await fs.writeFile(csvPath, csvContent, 'utf8');
    }
  }

  /**
   * Create CSV content from array of objects
   * @param data - Array of objects to convert to CSV
   * @returns CSV content as string
   */
  private createCSVContent(data: Record<string, any>[]): string {
    if (data.length === 0) {
      return '';
    }

    // Get headers from first object
    const headers = Object.keys(data[0]);
    
    // Create header row
    const headerRow = headers.map(header => this.escapeCSVField(header)).join(',');
    
    // Create data rows
    const dataRows = data.map(row => 
      headers.map(header => this.escapeCSVField(row[header] || '')).join(',')
    );
    
    return [headerRow, ...dataRows].join('\n') + '\n';
  }

  /**
   * Convert object to CSV row
   * @param obj - Object to convert
   * @returns CSV row as string
   */
  private objectToCSVRow(obj: Record<string, any>): string {
    const values = Object.values(obj);
    return values.map(value => this.escapeCSVField(value)).join(',');
  }

  /**
   * Escape CSV field value
   * @param value - Value to escape
   * @returns Escaped value
   */
  private escapeCSVField(value: any): string {
    if (value === null || value === undefined) {
      return '';
    }

    const stringValue = String(value);
    
    // If value contains comma, newline, or quote, wrap in quotes and escape quotes
    if (stringValue.includes(',') || stringValue.includes('\n') || stringValue.includes('"')) {
      return `"${stringValue.replace(/"/g, '""')}"`;
    }
    
    return stringValue;
  }

  /**
   * Create a master CSV file with all profiles
   * @param profilesDir - Directory containing user folders
   * @returns Promise<string> - Path to master CSV file
   */
  async createMasterCSV(profilesDir: string): Promise<string> {
    const masterCsvPath = path.join(profilesDir, 'all_profiles.csv');
    const allData: Record<string, any>[] = [];

    try {
      // Read all user directories
      const userDirs = await fs.readdir(profilesDir);
      
      for (const userDir of userDirs) {
        const userPath = path.join(profilesDir, userDir);
        const stat = await fs.stat(userPath);
        
        if (stat.isDirectory()) {
          // Look for CSV files in user directory
          const files = await fs.readdir(userPath);
          const csvFile = files.find(file => file.endsWith('_data.csv'));
          
          if (csvFile) {
            const csvPath = path.join(userPath, csvFile);
            const csvContent = await fs.readFile(csvPath, 'utf8');
            const lines = csvContent.trim().split('\n');
            
            // Skip header row for subsequent files
            const dataLines = allData.length === 0 ? lines : lines.slice(1);
            
            // Parse CSV lines
            for (const line of dataLines) {
              if (line.trim()) {
                const values = this.parseCSVLine(line);
                const headers = Object.keys(allData[0] || {});
                const row: Record<string, any> = {};
                
                headers.forEach((header, index) => {
                  row[header] = values[index] || '';
                });
                
                allData.push(row);
              }
            }
          }
        }
      }

      // Create master CSV
      const csvContent = this.createCSVContent(allData);
      await fs.writeFile(masterCsvPath, csvContent, 'utf8');
      
      return masterCsvPath;
    } catch (error) {
      throw new Error(`Failed to create master CSV: ${error}`);
    }
  }

  /**
   * Parse a CSV line into array of values
   * @param line - CSV line to parse
   * @returns Array of values
   */
  private parseCSVLine(line: string): string[] {
    const values: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      
      if (char === '"') {
        if (inQuotes && line[i + 1] === '"') {
          // Escaped quote
          current += '"';
          i++; // Skip next quote
        } else {
          // Toggle quote state
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        // End of field
        values.push(current);
        current = '';
      } else {
        current += char;
      }
    }
    
    // Add last field
    values.push(current);
    
    return values;
  }
}
