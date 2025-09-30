/**
 * TypeScript interfaces for Twitter API v2 User data
 */

export interface PublicMetrics {
  followers_count: number;
  following_count: number;
  tweet_count: number;
  listed_count: number;
  like_count: number;
  media_count: number;
}

export interface Subscription {
  subscribes_to_you: boolean;
}

export interface TwitterUser {
  id: string;
  name: string;
  username: string;
  description: string;
  profile_image_url: string;
  profile_banner_url: string;
  verified: boolean;
  public_metrics: PublicMetrics;
  subscription: Subscription;
  subscription_type: string;
}

export interface TwitterApiResponse {
  data: TwitterUser;
}

export interface TwitterApiError {
  errors: Array<{
    value: string;
    detail: string;
    title: string;
    resource_type: string;
    parameter: string;
    resource_id: string;
  }>;
}

/**
 * Parsed Twitter profile data with additional computed fields
 */
export class TwitterProfileData {
  public readonly id: string;
  public readonly name: string;
  public readonly username: string;
  public readonly description: string;
  public readonly profileImageUrl: string;
  public readonly profileBannerUrl: string;
  public readonly verified: boolean;
  public readonly followersCount: number;
  public readonly followingCount: number;
  public readonly tweetCount: number;
  public readonly listedCount: number;
  public readonly likeCount: number;
  public readonly mediaCount: number;
  public readonly subscribesToYou: boolean;
  public readonly subscriptionType: string;

  constructor(user: TwitterUser) {
    this.id = user.id;
    this.name = user.name;
    this.username = user.username;
    this.description = user.description;
    this.profileImageUrl = user.profile_image_url;
    this.profileBannerUrl = user.profile_banner_url;
    this.verified = user.verified;
    this.followersCount = user.public_metrics.followers_count;
    this.followingCount = user.public_metrics.following_count;
    this.tweetCount = user.public_metrics.tweet_count;
    this.listedCount = user.public_metrics.listed_count;
    this.likeCount = user.public_metrics.like_count;
    this.mediaCount = user.public_metrics.media_count;
    this.subscribesToYou = user.subscription.subscribes_to_you;
    this.subscriptionType = user.subscription_type;
  }

  /**
   * Get a formatted follower count (e.g., "1.2K", "5.3M")
   */
  getFormattedFollowersCount(): string {
    return this.formatNumber(this.followersCount);
  }

  /**
   * Get a formatted following count (e.g., "1.2K", "5.3M")
   */
  getFormattedFollowingCount(): string {
    return this.formatNumber(this.followingCount);
  }

  /**
   * Get a formatted tweet count (e.g., "1.2K", "5.3M")
   */
  getFormattedTweetCount(): string {
    return this.formatNumber(this.tweetCount);
  }

  private formatNumber(num: number): string {
    if (num >= 1000000) {
      return (num / 1000000).toFixed(1) + 'M';
    } else if (num >= 1000) {
      return (num / 1000).toFixed(1) + 'K';
    }
    return num.toString();
  }

  /**
   * Convert to plain object for serialization
   */
  toJSON(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      username: this.username,
      description: this.description,
      profileImageUrl: this.profileImageUrl,
      profileBannerUrl: this.profileBannerUrl,
      verified: this.verified,
      followersCount: this.followersCount,
      followingCount: this.followingCount,
      tweetCount: this.tweetCount,
      listedCount: this.listedCount,
      likeCount: this.likeCount,
      mediaCount: this.mediaCount,
      subscribesToYou: this.subscribesToYou,
      subscriptionType: this.subscriptionType,
      formattedFollowersCount: this.getFormattedFollowersCount(),
      formattedFollowingCount: this.getFormattedFollowingCount(),
      formattedTweetCount: this.getFormattedTweetCount(),
    };
  }

  /**
   * Convert to CSV row data
   */
  toCSVRow(): Record<string, any> {
    return {
      id: this.id,
      name: this.name,
      username: this.username,
      description: this.description,
      verified: this.verified,
      followers_count: this.followersCount,
      following_count: this.followingCount,
      tweet_count: this.tweetCount,
      listed_count: this.listedCount,
      like_count: this.likeCount,
      media_count: this.mediaCount,
      subscribes_to_you: this.subscribesToYou,
      subscription_type: this.subscriptionType,
      profile_image_url: this.profileImageUrl,
      profile_banner_url: this.profileBannerUrl,
      created_at: new Date().toISOString()
    };
  }
}