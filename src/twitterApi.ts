import axios, { AxiosResponse } from 'axios';
import { TwitterApiResponse, TwitterApiError, TwitterUser, TwitterProfileData } from './types';

/**
 * Twitter API v2 Client
 */
export class TwitterApiClient {
  private readonly baseUrl: string = 'https://api.twitter.com/2';
  private readonly bearerToken: string;

  constructor(bearerToken: string) {
    if (!bearerToken) {
      throw new Error('Bearer token is required');
    }
    this.bearerToken = bearerToken;
  }

  /**
   * Get user data by username
   * @param username - The Twitter username (without @)
   * @returns Promise<TwitterProfileData> - The user data wrapped in a dataclass
   */
  async getUserByUsername(username: string): Promise<TwitterProfileData> {
    try {
      const response: AxiosResponse<TwitterApiResponse> = await axios.get(
        `${this.baseUrl}/users/by/username/${username}`,
        {
          params: {
            'user.fields': 'description,profile_banner_url,profile_image_url,public_metrics,subscription,subscription_type,username,verified'
          },
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.data) {
        throw new Error('No user data found in API response');
      }

      return new TwitterProfileData(response.data.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`User not found: @${username}`);
        } else if (error.response?.status === 401) {
          throw new Error('Invalid or expired bearer token');
        } else if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (error.response?.data) {
          const apiError = error.response.data as TwitterApiError;
          if (apiError.errors && apiError.errors.length > 0) {
            throw new Error(`Twitter API Error: ${apiError.errors[0].detail}`);
          }
        }
        throw new Error(`Twitter API request failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Get user data by user ID
   * @param userId - The Twitter user ID
   * @returns Promise<TwitterProfileData> - The user data wrapped in a dataclass
   */
  async getUserById(userId: string): Promise<TwitterProfileData> {
    try {
      const response: AxiosResponse<TwitterApiResponse> = await axios.get(
        `${this.baseUrl}/users/${userId}`,
        {
          params: {
            'user.fields': 'description,profile_banner_url,profile_image_url,public_metrics,subscription,subscription_type,username,verified'
          },
          headers: {
            'Authorization': `Bearer ${this.bearerToken}`,
            'Content-Type': 'application/json'
          }
        }
      );

      if (!response.data.data) {
        throw new Error('No user data found in API response');
      }

      return new TwitterProfileData(response.data.data);
    } catch (error) {
      if (axios.isAxiosError(error)) {
        if (error.response?.status === 404) {
          throw new Error(`User not found with ID: ${userId}`);
        } else if (error.response?.status === 401) {
          throw new Error('Invalid or expired bearer token');
        } else if (error.response?.status === 429) {
          throw new Error('Rate limit exceeded. Please try again later.');
        } else if (error.response?.data) {
          const apiError = error.response.data as TwitterApiError;
          if (apiError.errors && apiError.errors.length > 0) {
            throw new Error(`Twitter API Error: ${apiError.errors[0].detail}`);
          }
        }
        throw new Error(`Twitter API request failed: ${error.message}`);
      }
      throw error;
    }
  }

  /**
   * Test the API connection
   * @returns Promise<boolean> - True if connection is successful
   */
  async testConnection(): Promise<boolean> {
    try {
      // Try to get a known user (Twitter's official account)
      await this.getUserByUsername('twitter');
      return true;
    } catch (error) {
      console.error('API connection test failed:', error);
      return false;
    }
  }
}