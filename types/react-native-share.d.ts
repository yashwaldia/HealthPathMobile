// types/react-native-share.d.ts
declare module 'react-native-share' {
  export interface ShareOptions {
    title?: string;
    message?: string;
    url?: string;
    urls?: string[];
    type?: string;
    subject?: string;
    email?: string;
    recipient?: string;
    excludedActivityTypes?: string[];
    failOnCancel?: boolean;
    showAppsToView?: boolean;
    filename?: string;
    saveToFiles?: boolean;
    activityItemSources?: ActivityItemSource[];
  }

  export interface ActivityItemSource {
    placeholderItem: {
      type: string;
      content: string;
    };
    item: {
      default: {
        type: string;
        content: string;
      };
    };
    subject?: {
      default: string;
    };
    dataTypeIdentifier?: {
      default: string;
    };
    thumbnailImage?: {
      default: string;
    };
  }

  export interface ShareSingleOptions extends ShareOptions {
    social: 
      | 'facebook'
      | 'twitter'
      | 'whatsapp'
      | 'instagram'
      | 'instagram-stories'
      | 'googleplus'
      | 'email'
      | 'pinterest'
      | 'linkedin'
      | 'sms'
      | 'telegram'
      | 'snapchat';
    forceDialog?: boolean;
  }

  export interface ShareResult {
    success?: boolean;
    message?: string;
    app?: string;
  }

  export interface Social {
    FACEBOOK: 'facebook';
    TWITTER: 'twitter';
    WHATSAPP: 'whatsapp';
    INSTAGRAM: 'instagram';
    INSTAGRAM_STORIES: 'instagram-stories';
    GOOGLEPLUS: 'googleplus';
    EMAIL: 'email';
    PINTEREST: 'pinterest';
    LINKEDIN: 'linkedin';
    SMS: 'sms';
    TELEGRAM: 'telegram';
    SNAPCHAT: 'snapchat';
  }

  export default class Share {
    static Social: Social;
    static open(options: ShareOptions): Promise<ShareResult>;
    static shareSingle(options: ShareSingleOptions): Promise<ShareResult>;
    static isPackageInstalled(packageName: string): Promise<boolean>;
  }
}
