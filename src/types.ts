export interface VideoVariant {
  quality: string;
  url: string;
  size: string;
  format: 'mp4' | 'mp3';
  resolution?: string;
  bitrate?: number;
}

export interface TweetData {
  id: string;
  url?: string;
  text: string;
  author: string;
  authorHandle: string;
  authorAvatar: string;
  thumbnailUrl: string;
  variants: VideoVariant[];
  duration: string;
  timestamp: string;
}

export interface GeminiAnalysis {
  summary: string;
  sentiment: 'Positive' | 'Negative' | 'Neutral';
  keywords: string[];
  isHarmful: boolean;
}