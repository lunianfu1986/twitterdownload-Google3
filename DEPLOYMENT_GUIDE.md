# Deployment Guide for X-Saver

This project consists of two parts:
1. **Frontend**: The React UI (Visuals).
2. **Backend**: The Node.js server (The "Crawler" that downloads videos).

Since X (Twitter) videos cannot be downloaded directly from a browser due to security (CORS), you **MUST** deploy the `server.js` backend for the app to work with real videos.

---

## Part 1: Deploying the Backend (The Crawler)

The backend uses `yt-dlp` (via `youtube-dl-exec`). This requires a server that has **Python** installed.

### Option A: Render.com (Recommended & Free Tier)
1. Create a GitHub repository and push `server.js` and `package.json` to it.
2. Sign up for [Render.com](https://render.com).
3. Click "New Web Service".
4. Connect your GitHub repo.
5. **Environment**: Select `Node`.
6. **Build Command**: `npm install`
7. **Start Command**: `node server.js`
8. **IMPORTANT**: Render natively supports Python in their Node environment, but if it fails, you may need to add a "Build URL" to install Python or use a Dockerfile.

### Option B: VPS (DigitalOcean / AWS / Linode)
1. SSH into your server.
2. Install Python and FFmpeg:
   ```bash
   sudo apt update
   sudo apt install python3 ffmpeg
   ```
3. Copy your project files.
4. Run `npm install`.
5. Run `node server.js`.

Once deployed, note down your Backend URL (e.g., `https://my-x-saver-backend.onrender.com`).

---

## Part 2: Connecting Frontend to Backend

1. Open `App.tsx` in your frontend code.
2. Find the `handleDownload` function.
3. Replace the `setTimeout` simulation with a real fetch call:

```javascript
// REPLACE THIS MOCK CODE
// setTimeout(() => { ... }, 2500);

// WITH THIS REAL CODE
try {
  const response = await fetch('https://YOUR-BACKEND-URL.com/api/info?url=' + encodeURIComponent(url));
  const result = await response.json();
  
  if (result.error) throw new Error(result.error);
  
  setData(result);
} catch (err) {
  setError(err.message);
} finally {
  setLoading(false);
}
```

## Part 3: Deploying the Frontend

1. Push your frontend code (App.tsx, etc.) to GitHub.
2. Go to [Vercel](https://vercel.com) or [Netlify](https://netlify.com).
3. Import the project.
4. Deploy!

## Why is this separate?
Twitter aggressively blocks browser-based scrapers. To reliably download videos, you need a server-side IP address and powerful tools like `yt-dlp`, which cannot run inside a browser tab.
