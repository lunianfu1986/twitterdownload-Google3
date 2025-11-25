const axios = require('axios');

// The public Bearer Token used by the official Twitter Web Client
const BEARER_TOKEN = 'AAAAAAPt4yAAAAAAAAAAAAAAAFQPCv4LookK7Ho5CM2F8M4L2n8%3D3vVWrw3M7x5I6nQ865d6rW411k4Z85f2r72e1d51';

// Common GraphQL Query IDs (These rotate occasionally, having a fallback list helps)
const GRAPHQL_FEATURES = {
    "creator_subscriptions_tweet_preview_api_enabled": true,
    "communities_web_enable_tweet_community_results_fetch": true,
    "c9s_tweet_anatomy_moderator_badge_enabled": true,
    "articles_preview_enabled": true,
    "tweetypie_unmention_optimization_enabled": true,
    "responsive_web_edit_tweet_api_enabled": true,
    "graphql_is_translatable_rweb_tweet_is_translatable_enabled": true,
    "view_counts_everywhere_api_enabled": true,
    "longform_notetweets_consumption_enabled": true,
    "responsive_web_twitter_article_tweet_consumption_enabled": true,
    "tweet_awards_web_tipping_enabled": false,
    "freedom_of_speech_not_reach_fetch_enabled": true,
    "standardized_nudges_misinfo": true,
    "tweet_with_visibility_results_prefer_gql_limited_actions_policy_enabled": true,
    "rweb_video_timestamps_enabled": true,
    "longform_notetweets_rich_text_read_enabled": true,
    "longform_notetweets_inline_media_enabled": true,
    "responsive_web_graphql_exclude_directive_enabled": true,
    "verified_phone_label_enabled": false,
    "responsive_web_media_download_video_enabled": false,
    "responsive_web_graphql_skip_user_profile_image_extensions_enabled": false,
    "responsive_web_graphql_timeline_navigation_enabled": true,
    "responsive_web_enhance_cards_enabled": false
};

module.exports = async (req, res) => {
    // Enable CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS,PATCH,DELETE,POST,PUT');
    res.setHeader('Access-Control-Allow-Headers', 'X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version');

    if (req.method === 'OPTIONS') {
        res.status(200).end();
        return;
    }

    const { url } = req.query;

    if (!url) {
        return res.status(400).json({ error: 'URL is required' });
    }

    try {
        // 1. Extract Tweet ID
        const tweetIdMatch = url.match(/(?:twitter|x)\.com\/(?:.+)\/status\/(\d+)/);
        const tweetId = tweetIdMatch ? tweetIdMatch[1] : null;

        if (!tweetId) {
            return res.status(400).json({ error: 'Invalid X/Twitter URL format.' });
        }

        console.log(`Processing Tweet ID: ${tweetId}`);

        // 2. Get Guest Token
        // The guest token is required to make read-only calls to the GraphQL API
        const guestTokenResponse = await axios.post('https://api.twitter.com/1.1/guest/activate.json', {}, {
            headers: {
                'Authorization': `Bearer ${BEARER_TOKEN}`,
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
            }
        });

        const guestToken = guestTokenResponse.data.guest_token;
        console.log("Guest Token obtained:", guestToken);

        // 3. Call GraphQL API (TweetResultByRestId)
        // This endpoint mimics the official web client request
        const graphqlUrl = 'https://twitter.com/i/api/graphql/QuBlQ6bnvF7rS80nswghWg/TweetResultByRestId';
        
        const variables = {
            "tweetId": tweetId,
            "withCommunity": false,
            "includePromotedContent": false,
            "withVoice": false
        };

        const response = await axios.get(graphqlUrl, {
            params: {
                variables: JSON.stringify(variables),
                features: JSON.stringify(GRAPHQL_FEATURES)
            },
            headers: {
                'Authorization': `Bearer ${BEARER_TOKEN}`,
                'x-guest-token': guestToken,
                'x-twitter-active-user': 'yes',
                'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
                'content-type': 'application/json'
            }
        });

        const result = response.data?.data?.tweetResult?.result;

        if (!result) {
            throw new Error('Tweet data not found in GraphQL response');
        }

        // 4. Parse the complex GraphQL Response
        // Twitter wraps data differently depending on if it's a Note, a regular tweet, or has strict visibility
        const legacy = result.legacy || result.tweet?.legacy;
        const noteTweet = result.note_tweet?.note_tweet_results?.result;
        const core = result.core || result.tweet?.core;
        
        if (!legacy) {
             // Sometimes it's a "Tombstone" (deleted/protected)
             if (result.__typename === 'TweetTombstone') {
                 return res.status(400).json({ error: 'This tweet is deleted or protected.' });
             }
             throw new Error('Could not parse legacy tweet data.');
        }

        const text = noteTweet?.text || legacy.full_text;
        const user = core?.user_results?.result?.legacy;
        const authorName = user?.name || 'Unknown';
        const authorHandle = user?.screen_name ? `@${user.screen_name}` : '@unknown';
        const authorAvatar = user?.profile_image_url_https || '';
        const timestamp = legacy.created_at;

        // 5. Extract Media
        // Media can be in 'extended_entities' or inside 'note_tweet'
        const mediaArr = legacy.extended_entities?.media || legacy.entities?.media || [];
        
        let variants = [];
        let duration = "0:00";
        let thumbnailUrl = "";

        // Find the video media object
        const videoMedia = mediaArr.find(m => m.type === 'video' || m.type === 'animated_gif');

        if (videoMedia) {
            thumbnailUrl = videoMedia.media_url_https;
            
            // Calc duration
            if (videoMedia.video_info?.duration_millis) {
                const ms = videoMedia.video_info.duration_millis;
                const min = Math.floor(ms / 60000);
                const sec = ((ms % 60000) / 1000).toFixed(0);
                duration = `${min}:${sec.padStart(2, '0')}`;
            }

            // Parse variants
            const rawVariants = videoMedia.video_info?.variants || [];
            
            variants = rawVariants
                .filter(v => v.content_type === 'video/mp4') // We only want MP4s
                .map(v => {
                    let quality = 'SD';
                    // Try to extract resolution from URL (e.g., .../vid/1280x720/...)
                    const resMatch = v.url.match(/\/vid\/(\d+x\d+)\//);
                    if (resMatch) {
                        const [w, h] = resMatch[1].split('x').map(Number);
                        if (h >= 1080) quality = '1080p';
                        else if (h >= 720) quality = '720p';
                        else if (h >= 480) quality = '480p';
                        else quality = '360p';
                    } else {
                        // Fallback using bitrate
                        if (v.bitrate > 2000000) quality = '1080p';
                        else if (v.bitrate > 800000) quality = '720p';
                    }

                    // Estimate size
                    const bitrate = v.bitrate || 0;
                    const durationSec = (videoMedia.video_info?.duration_millis || 0) / 1000;
                    const sizeBytes = (bitrate * durationSec) / 8;
                    const sizeMB = sizeBytes > 0 ? (sizeBytes / (1024 * 1024)).toFixed(1) + ' MB' : 'Unknown';

                    return {
                        quality,
                        url: v.url,
                        size: sizeMB,
                        format: 'mp4',
                        bitrate: v.bitrate
                    };
                })
                .sort((a, b) => b.bitrate - a.bitrate); // Best quality first

            // Add Audio Option
            if (variants.length > 0) {
                 variants.push({
                     quality: 'Audio Only',
                     url: variants[0].url,
                     size: 'MP3',
                     format: 'mp3',
                     bitrate: 0
                 });
            }
        } else {
             // Fallback: Check if it's just an image or text
             if (mediaArr.length > 0) {
                 thumbnailUrl = mediaArr[0].media_url_https;
             }
             return res.status(400).json({ 
                 error: 'This tweet does not contain a video or GIF. It might be an image or text-only tweet.' 
             });
        }

        // 6. Return Data
        return res.json({
            id: tweetId,
            text,
            author: authorName,
            authorHandle,
            authorAvatar,
            thumbnailUrl,
            duration,
            timestamp,
            variants
        });

    } catch (error) {
        console.error('Full Error:', error);
        
        // Detailed error for frontend
        const errorMsg = error.response?.data?.errors?.[0]?.message || error.message;
        
        res.status(500).json({ 
            error: `Failed to fetch video: ${errorMsg}. Try checking if the account is private.` 
        });
    }
};
