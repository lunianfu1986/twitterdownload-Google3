const axios = require('axios');

// --- CONSTANTS ---
const BEARER_TOKEN = 'AAAAAAPt4yAAAAAAAAAAAAAAAFQPCv4LookK7Ho5CM2F8M4L2n8%3D3vVWrw3M7x5I6nQ865d6rW411k4Z85f2r72e1d51';

const COMMON_HEADERS = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept-Language': 'en-US,en;q=0.9',
};

// --- HELPER: FORMAT DURATION ---
const formatDuration = (ms) => {
    if (!ms) return "0:00";
    const totalSeconds = Math.floor(ms / 1000);
    const min = Math.floor(totalSeconds / 60);
    const sec = totalSeconds % 60;
    return `${min}:${sec.toString().padStart(2, '0')}`;
};

// --- HELPER: CALCULATE SIZE ---
const estimateSize = (bitrate, durationMs) => {
    if (!bitrate || !durationMs) return "Unknown";
    const durationSec = durationMs / 1000;
    const sizeBytes = (bitrate * durationSec) / 8;
    return (sizeBytes / (1024 * 1024)).toFixed(1) + ' MB';
};

// --- STRATEGY 1: GRAPHQL API (Guest Token) ---
async function fetchGraphQLData(tweetId) {
    console.log(`[GraphQL] Attempting to fetch Tweet ID: ${tweetId}`);

    // 1. Get Guest Token
    const guestTokenResponse = await axios.post('https://api.twitter.com/1.1/guest/activate.json', {}, {
        headers: {
            'Authorization': `Bearer ${BEARER_TOKEN}`,
            ...COMMON_HEADERS
        }
    });
    const guestToken = guestTokenResponse.data.guest_token;

    // 2. Query GraphQL
    const graphqlUrl = 'https://twitter.com/i/api/graphql/QuBlQ6bnvF7rS80nswghWg/TweetResultByRestId';
    const variables = {
        "tweetId": tweetId,
        "withCommunity": false,
        "includePromotedContent": false,
        "withVoice": false
    };
    const features = {
        "creator_subscriptions_tweet_preview_api_enabled": true,
        "longform_notetweets_inline_media_enabled": true,
        "responsive_web_graphql_exclude_directive_enabled": true,
        "verified_phone_label_enabled": false,
        "responsive_web_graphql_timeline_navigation_enabled": true,
        "responsive_web_enhance_cards_enabled": false
    };

    const response = await axios.get(graphqlUrl, {
        params: {
            variables: JSON.stringify(variables),
            features: JSON.stringify(features)
        },
        headers: {
            'Authorization': `Bearer ${BEARER_TOKEN}`,
            'x-guest-token': guestToken,
            'content-type': 'application/json',
            ...COMMON_HEADERS
        }
    });

    const result = response.data?.data?.tweetResult?.result;
    if (!result) throw new Error("GraphQL: No result found.");

    // Parse Data
    const legacy = result.legacy || result.tweet?.legacy;
    const noteTweet = result.note_tweet?.note_tweet_results?.result;
    const user = result.core?.user_results?.result?.legacy || result.tweet?.core?.user_results?.result?.legacy;

    if (!legacy) throw new Error("GraphQL: Legacy data missing.");

    const mediaArr = legacy.extended_entities?.media || legacy.entities?.media || [];
    const videoMedia = mediaArr.find(m => m.type === 'video' || m.type === 'animated_gif');

    if (!videoMedia) throw new Error("This tweet does not contain a video.");

    // Extract Variants
    const variants = (videoMedia.video_info?.variants || [])
        .filter(v => v.content_type === 'video/mp4')
        .map(v => {
            let quality = 'SD';
            const resMatch = v.url.match(/\/vid\/(\d+x\d+)\//);
            if (resMatch) {
                const h = parseInt(resMatch[1].split('x')[1]);
                if (h >= 1080) quality = '1080p';
                else if (h >= 720) quality = '720p';
                else if (h >= 480) quality = '480p';
                else quality = '360p';
            }
            return {
                quality,
                url: v.url,
                format: 'mp4',
                bitrate: v.bitrate,
                size: estimateSize(v.bitrate, videoMedia.video_info?.duration_millis)
            };
        })
        .sort((a, b) => b.bitrate - a.bitrate);

    return {
        id: tweetId,
        text: noteTweet?.text || legacy.full_text,
        author: user?.name || 'Unknown',
        authorHandle: user?.screen_name ? `@${user.screen_name}` : '@unknown',
        authorAvatar: user?.profile_image_url_https || '',
        thumbnailUrl: videoMedia.media_url_https,
        duration: formatDuration(videoMedia.video_info?.duration_millis),
        timestamp: legacy.created_at,
        variants
    };
}

// --- STRATEGY 2: SYNDICATION API (Fallback) ---
// This API is used for embedding tweets on websites and requires NO authentication.
async function fetchSyndicationData(tweetId) {
    console.log(`[Syndication] Attempting fallback fetch for Tweet ID: ${tweetId}`);
    
    const url = `https://cdn.syndication.twimg.com/tweet-result?id=${tweetId}&lang=en`;
    
    const response = await axios.get(url, { headers: COMMON_HEADERS });
    const data = response.data;

    if (!data) throw new Error("Syndication: No data returned.");

    const videoInfo = data.video || (data.mediaDetails && data.mediaDetails.find(m => m.type === 'video' || m.type === 'animated_gif'));
    
    if (!videoInfo) throw new Error("This tweet does not contain a video.");

    // Extract variants (Syndication structure is slightly different)
    const variants = (videoInfo.variants || [])
        .filter(v => v.type === 'video/mp4')
        .map(v => {
            let quality = 'SD';
            // Syndication doesn't always have resolution in URL, sometimes uses 'src'
            const src = v.src || v.url;
            const resMatch = src.match(/\/vid\/(\d+x\d+)\//);
            if (resMatch) {
                const h = parseInt(resMatch[1].split('x')[1]);
                if (h >= 1080) quality = '1080p';
                else if (h >= 720) quality = '720p';
                else if (h >= 480) quality = '480p';
                else quality = '360p';
            }
            return {
                quality,
                url: src,
                format: 'mp4',
                // Syndication doesn't always give bitrate, use generic sort
                bitrate: 0, 
                size: 'Unknown' 
            };
        });
    
    // Sort by resolution guess if bitrate missing
    variants.sort((a, b) => {
        const getRes = (q) => parseInt(q) || 0;
        return getRes(b.quality) - getRes(a.quality);
    });

    return {
        id: data.id_str,
        text: data.text,
        author: data.user?.name || 'Unknown',
        authorHandle: data.user?.screen_name ? `@${data.user.screen_name}` : '@unknown',
        authorAvatar: data.user?.profile_image_url_https || '',
        thumbnailUrl: data.photos?.[0]?.url || '',
        duration: formatDuration(videoInfo.durationMs),
        timestamp: data.created_at,
        variants
    };
}

// --- MAIN HANDLER ---
module.exports = async (req, res) => {
    // CORS
    res.setHeader('Access-Control-Allow-Credentials', true);
    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET,OPTIONS');
    res.setHeader('Access-Control-Allow-Headers', 'Content-Type');

    if (req.method === 'OPTIONS') return res.status(200).end();

    const { url } = req.query;
    if (!url) return res.status(400).json({ error: 'URL is required' });

    // Extract ID
    const tweetIdMatch = url.match(/(?:twitter|x)\.com\/(?:.+)\/status\/(\d+)/);
    const tweetId = tweetIdMatch ? tweetIdMatch[1] : null;

    if (!tweetId) return res.status(400).json({ error: 'Invalid URL format.' });

    try {
        // Try Primary Strategy
        const data = await fetchGraphQLData(tweetId);
        
        // Add MP3 Option
        if (data.variants.length > 0) {
            data.variants.push({
                quality: 'Audio Only',
                url: data.variants[0].url,
                format: 'mp3',
                size: 'MP3',
                bitrate: 0
            });
        }
        
        return res.json(data);

    } catch (primaryError) {
        console.warn("Primary strategy failed:", primaryError.message);

        try {
            // Try Fallback Strategy
            const data = await fetchSyndicationData(tweetId);
            
             // Add MP3 Option
            if (data.variants.length > 0) {
                data.variants.push({
                    quality: 'Audio Only',
                    url: data.variants[0].url,
                    format: 'mp3',
                    size: 'MP3',
                    bitrate: 0
                });
            }

            return res.json(data);

        } catch (fallbackError) {
            console.error("Fallback strategy failed:", fallbackError.message);
            
            // Determine user-friendly error
            let msg = "Failed to fetch video.";
            if (fallbackError.message.includes("does not contain a video")) {
                msg = "This tweet does not contain a video or GIF.";
            } else if (fallbackError.response?.status === 404) {
                msg = "Tweet not found. Check if the account is private.";
            }

            return res.status(500).json({ error: msg });
        }
    }
};
