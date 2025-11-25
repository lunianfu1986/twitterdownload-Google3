const axios = require('axios');

module.exports = async (req, res) => {
  // Allow CORS
  res.setHeader('Access-Control-Allow-Credentials', true);
  res.setHeader('Access-Control-Allow-Origin', '*');
  res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
  res.setHeader(
    'Access-Control-Allow-Headers',
    'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version'
  );

  if (req.method === 'OPTIONS') {
    res.status(200).end();
    return;
  }

  const { url } = req.query;

  if (!url) {
    return res.status(400).json({ error: 'URL is required' });
  }

  try {
    // Extract Tweet ID from URL (support x.com and twitter.com)
    const tweetIdMatch = url.match(/(?:twitter|x)\.com\/(?:.+)\/status\/(\d+)/);
    const tweetId = tweetIdMatch ? tweetIdMatch[1] : null;

    if (!tweetId) {
      return res.status(400).json({ error: 'Invalid X/Twitter URL format.' });
    }

    // Use Syndication API with Browser-like Headers to reduce blocking
    const apiUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&lang=en`;

    const response = await axios.get(apiUrl, {
      headers: {
        'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8',
        'Accept-Language': 'en-US,en;q=0.9',
        'Cache-Control': 'no-cache',
        'Pragma': 'no-cache'
      },
      timeout: 8000 // 8 seconds timeout
    });

    const data = response.data;

    if (!data) {
      return res.status(404).json({ error: 'Tweet not found or API request blocked.' });
    }

    // Extract video info
    let variants = [];
    let duration = "0:00";
    let type = "image";

    // Handle Media (Video/GIF)
    if (data.mediaDetails && data.mediaDetails.length > 0) {
        const media = data.mediaDetails[0];
        type = media.type;
        
        if (media.duration_millis) {
            const minutes = Math.floor(media.duration_millis / 60000);
            const seconds = ((media.duration_millis % 60000) / 1000).toFixed(0);
            duration = `${minutes}:${seconds.padStart(2, '0')}`;
        }

        if (type === 'video' || type === 'animated_gif') {
             // Calculate file sizes (approximation based on bitrate) and sort
             const videoVariants = media.video_info?.variants || [];
             
             variants = videoVariants
                .filter(v => v.content_type === 'video/mp4')
                .map(v => {
                    // Estimate size: (Bitrate / 8) * duration_seconds
                    const bitrate = v.bitrate || 0;
                    const sizeBytes = (bitrate / 8) * (media.duration_millis / 1000);
                    // If size is 0 or NaN, show placeholder
                    const sizeMB = (sizeBytes && sizeBytes > 0) 
                        ? (sizeBytes / (1024 * 1024)).toFixed(1) + ' MB' 
                        : 'Unknown size';
                    
                    // Determine resolution from url pattern or bitrate
                    let resolution = 'SD';
                    const resMatch = v.url.match(/\/vid\/(\d+x\d+)\//);
                    
                    if (resMatch) {
                      resolution = resMatch[1]; // e.g., 1280x720
                    } else {
                      // Fallback based on bitrate
                      if (bitrate >= 2000000) resolution = '1080p';
                      else if (bitrate >= 800000) resolution = '720p';
                      else if (bitrate >= 250000) resolution = '360p';
                    }

                    return {
                        quality: resolution,
                        url: v.url,
                        size: sizeMB,
                        format: 'mp4',
                        bitrate: bitrate
                    };
                })
                .sort((a, b) => b.bitrate - a.bitrate);
                
             // Add Audio Only option (extract highest bitrate audio)
             if (variants.length > 0) {
                 variants.push({
                     quality: 'Audio Only',
                     url: variants[0].url, // Use highest quality video for audio extraction
                     size: '~' + (parseFloat(variants[0].size) * 0.1).toFixed(1) + ' MB', // Rough estimate
                     format: 'mp3',
                     bitrate: 0
                 });
             }
        }
    }

    if (variants.length === 0 && type !== 'video' && type !== 'animated_gif') {
         return res.status(400).json({ error: 'This tweet does not contain a video or GIF.' });
    }

    // Prepare response
    const result = {
      id: data.id_str,
      text: data.text,
      author: data.user.name,
      authorHandle: `@${data.user.screen_name}`,
      authorAvatar: data.user.profile_image_url_https,
      thumbnailUrl: data.mediaDetails?.[0]?.media_url_https || data.user.profile_image_url_https,
      duration: duration,
      timestamp: data.created_at,
      variants: variants
    };

    res.json(result);

  } catch (error) {
    console.error('API Error:', error.message);
    const isBlocking = error.response && (error.response.status === 403 || error.response.status === 429);
    
    res.status(500).json({ 
      error: isBlocking 
        ? 'Server is temporarily blocked by X (Rate Limit). Please try again later.' 
        : 'Failed to fetch tweet details. Check URL or privacy settings.' 
    });
  }
};
