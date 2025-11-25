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
    // Extract Tweet ID from URL
    const tweetIdMatch = url.match(/(?:twitter|x)\.com\/(?:.+)\/status\/(\d+)/);
    const tweetId = tweetIdMatch ? tweetIdMatch[1] : null;

    if (!tweetId) {
      return res.status(400).json({ error: 'Invalid X/Twitter URL' });
    }

    console.log(`Fetching info for Tweet ID: ${tweetId}`);

    // Use the public Syndication API (Used for embedded tweets)
    // This is much more stable than Guest Token scraping and requires no keys.
    const apiUrl = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&lang=en`;

    const response = await axios.get(apiUrl);
    const data = response.data;

    if (!data) {
      return res.status(404).json({ error: 'Tweet not found' });
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
                    const sizeMB = sizeBytes ? (sizeBytes / (1024 * 1024)).toFixed(1) + ' MB' : 'Unknown';
                    
                    // Determine resolution from url pattern or bitrate
                    // Usually URLs contain /vid/1280x720/
                    let resolution = 'SD';
                    const resMatch = v.url.match(/\/vid\/(\d+x\d+)\//);
                    if (resMatch) resolution = resMatch[1];
                    else if (bitrate > 2000000) resolution = '1080p';
                    else if (bitrate > 800000) resolution = '720p';
                    else resolution = '480p';

                    return {
                        quality: resolution,
                        url: v.url,
                        size: sizeMB,
                        format: 'mp4',
                        bitrate: bitrate
                    };
                })
                .sort((a, b) => b.bitrate - a.bitrate);
        }
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
    res.status(500).json({ 
      error: 'Failed to fetch tweet. The account might be private or the tweet is deleted.' 
    });
  }
};