import { TweetData } from "./types";

export const APP_NAME = "X-Saver";

// Fallback data if API fails or for demo
export const MOCK_TWEET_DATA: TweetData = {
  id: "123456789",
  text: "Starship's flight 4 was a complete success! The views from the onboard cameras were absolutely breathtaking. 🚀🪐 #SpaceX",
  author: "SpaceX",
  authorHandle: "@SpaceX",
  authorAvatar: "https://pbs.twimg.com/profile_images/1082744382585856001/rH_k3PtQ_400x400.jpg",
  thumbnailUrl: "https://upload.wikimedia.org/wikipedia/commons/thumb/c/c5/Big_buck_bunny_poster_big.jpg/800px-Big_buck_bunny_poster_big.jpg",
  duration: "0:32",
  timestamp: "10:32 AM · Jun 6, 2024",
  variants: [
    {
      quality: "1080p",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      size: "24.5 MB",
      format: "mp4",
      bitrate: 2200000
    },
    {
      quality: "720p",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      size: "12.2 MB",
      format: "mp4",
      bitrate: 800000
    },
    {
      quality: "Audio Only",
      url: "https://commondatastorage.googleapis.com/gtv-videos-bucket/sample/BigBuckBunny.mp4",
      size: "1.2 MB",
      format: "mp3",
    }
  ]
};

export const FEATURES = [
  {
    title: "Ultra Fast Download",
    description: "Our optimized servers ensure you get your videos in seconds, utilizing direct CDN connections.",
    icon: "zap"
  },
  {
    title: "No Watermarks",
    description: "Download clean videos without any annoying logos, watermarks or attribution text overlay.",
    icon: "droplet"
  },
  {
    title: "All Devices Supported",
    description: "Works perfectly on iPhone, iPad, Android, Windows, Mac, and Linux without installing any software.",
    icon: "smartphone"
  },
  {
    title: "100% Free & Secure",
    description: "We don't track your download history. The service is completely free and requires no registration.",
    icon: "shield"
  },
  {
    title: "MP4 & MP3 Support",
    description: "Choose between high-definition video formats or extract just the audio in MP3 format.",
    icon: "music"
  },
  {
    title: "Unlimited Downloads",
    description: "There are no limits on how many videos you can save. Download as much as you want.",
    icon: "infinity"
  }
];

export const FAQ_ITEMS = [
  {
    question: "How to download videos from X (Twitter)?",
    answer: "1. Open the X app or website and find the video.\n2. Click the 'Share' icon and copy the link.\n3. Paste the link into X-Saver input box and hit Download.\n4. Choose your preferred quality and save."
  },
  {
    question: "Is this service free?",
    answer: "Yes, X-Saver is 100% free to use. We do not charge for any downloads, and there are no hidden subscription fees."
  },
  {
    question: "Where are the videos saved on my device?",
    answer: "Videos are usually saved in the 'Downloads' folder on Windows, Mac, and Android. On iPhone, you can find them in the Files app or save them to Photos."
  },
  {
    question: "Can I download videos from private accounts?",
    answer: "No. We respect user privacy. You can only download videos from public accounts that are visible to everyone."
  },
  {
    question: "Do you store downloaded videos?",
    answer: "No, we do not host or store any videos on our servers. All downloads are directly from X (Twitter) servers."
  }
];

// Content for "Pages"
export const PAGES_CONTENT: Record<string, { title: string; content: string }> = {
  'privacy': {
    title: "Privacy Policy",
    content: `
      <h2>1. Information We Collect</h2>
      <p>We operate with a strict privacy-first approach. When you use X-Saver, we do not collect personal information such as your name, email address, or phone number. We do not require registration to use our service.</p>
      
      <h2>2. Log Data</h2>
      <p>Like most websites, we may collect standard log data such as your IP address, browser type, and access times for security and analytics purposes. This data is aggregated and not used to identify individuals.</p>
      
      <h2>3. Cookies</h2>
      <p>We use essential cookies to ensure the website functions correctly. We may use third-party analytics cookies (like Google Analytics) to understand how our site is used and improve the user experience.</p>
      
      <h2>4. Data Security</h2>
      <p>We implement industry-standard security measures to protect our website. However, please note that no method of transmission over the internet is 100% secure.</p>
    `
  },
  'terms': {
    title: "Terms of Service",
    content: `
      <h2>1. Acceptance of Terms</h2>
      <p>By accessing and using X-Saver, you agree to comply with these Terms of Service. If you do not agree, please do not use our website.</p>
      
      <h2>2. Permitted Use</h2>
      <p>Our service is intended for personal, non-commercial use only. You are responsible for ensuring that your use of downloaded content complies with copyright laws and the terms of service of the source platform (X/Twitter).</p>
      
      <h2>3. Intellectual Property</h2>
      <p>We do not claim ownership of any content downloaded through our service. All rights belong to the original content creators.</p>
      
      <h2>4. Limitation of Liability</h2>
      <p>X-Saver is provided "as is" without warranties of any kind. We are not liable for any damages arising from the use or inability to use our service.</p>
    `
  },
  'about': {
    title: "About Us",
    content: `
      <p>Welcome to X-Saver, the premier tool for downloading content from X (formerly Twitter). Born from a need for a clean, fast, and reliable downloader, X-Saver was built to provide the best user experience without the clutter found on other sites.</p>
      <p>Our mission is simple: to make archiving and saving digital memories from social media as easy and accessible as possible. We believe in open access to information and user privacy.</p>
      <p>Our team consists of passionate developers and designers dedicated to maintaining high-quality web tools. We constantly update our algorithms to ensure compatibility with the latest platform changes.</p>
    `
  },
  'contact': {
    title: "Contact Us",
    content: `
      <p>Have questions, suggestions, or facing issues? We'd love to hear from you.</p>
      <p><strong>Email:</strong> support@x-saver.net</p>
      <p><strong>Business Inquiries:</strong> business@x-saver.net</p>
      <p>Please allow up to 24-48 hours for a response from our support team.</p>
    `
  },
  'blog': {
    title: "Latest News & Updates",
    content: `
      <div class="space-y-6">
        <div class="border-b pb-4">
          <h3 class="text-xl font-bold mb-2">Update: Faster Downloads with New Engine</h3>
          <p class="text-slate-500 text-sm mb-2">October 24, 2024</p>
          <p>We have deployed a new parsing engine that improves download link generation speed by 40%. Enjoy instant access to your favorite media!</p>
        </div>
        <div class="border-b pb-4">
          <h3 class="text-xl font-bold mb-2">How to Save GIFs from X</h3>
          <p class="text-slate-500 text-sm mb-2">September 15, 2024</p>
          <p>Did you know X-Saver also supports high-quality GIF downloads? Simply paste the tweet link containing the GIF, and we'll convert it to MP4 for easy sharing on other platforms like WhatsApp and Discord.</p>
        </div>
        <div>
          <h3 class="text-xl font-bold mb-2">Welcome to the new X-Saver</h3>
          <p class="text-slate-500 text-sm mb-2">August 1, 2024</p>
          <p>We are excited to launch our redesigned interface. Cleaner, faster, and mobile-optimized.</p>
        </div>
      </div>
    `
  },
  'legal': {
    title: "Legal Disclaimer",
    content: `
      <p>X-Saver is not affiliated, associated, authorized, endorsed by, or in any way officially connected with X Corp (formerly Twitter Inc.) or any of its subsidiaries or its affiliates.</p>
      <p>The names X and Twitter as well as related names, marks, emblems and images are registered trademarks of their respective owners.</p>
      <p>X-Saver is a tool for educational and personal use. We strictly prohibit the use of our service for downloading copyrighted material without permission.</p>
    `
  }
};