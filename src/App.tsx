import React, { useState, useEffect } from 'react';
import { GoogleGenAI } from "@google/genai";
import { 
  Download, 
  Link as LinkIcon, 
  AlertCircle, 
  Play, 
  Zap, 
  Smartphone, 
  ShieldCheck, 
  Sparkles,
  X,
  Copy,
  Music,
  Video,
  Check,
  ChevronDown,
  ChevronUp,
  Droplet,
  Infinity as InfinityIcon,
  Menu
} from 'lucide-react';
import { TweetData, GeminiAnalysis } from './types';
import { FAQ_ITEMS, FEATURES, PAGES_CONTENT } from './constants';

// --- Icons mapping for dynamic features ---
const IconMap: Record<string, React.FC<any>> = {
  zap: Zap,
  smartphone: Smartphone,
  shield: ShieldCheck,
  droplet: Droplet,
  music: Music,
  infinity: InfinityIcon
};

// --- View Types ---
type ViewState = 'home' | 'privacy' | 'terms' | 'about' | 'contact' | 'blog' | 'legal' | 'how-to';

export default function App() {
  const [currentView, setCurrentView] = useState<ViewState>('home');
  const [url, setUrl] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<TweetData | null>(null);
  const [geminiAnalysis, setGeminiAnalysis] = useState<GeminiAnalysis | null>(null);
  const [analyzing, setAnalyzing] = useState(false);
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [openFaqIndex, setOpenFaqIndex] = useState<number | null>(null);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Scroll to top when view changes
  useEffect(() => {
    window.scrollTo(0, 0);
  }, [currentView]);

  const handleDownload = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!url.trim()) return;
    
    // Basic validation
    if (!url.match(/(twitter\.com|x\.com)/)) {
      setError("Please enter a valid URL (e.g., x.com/status/...)");
      return;
    }

    setLoading(true);
    setError(null);
    setData(null);
    setGeminiAnalysis(null);

    try {
      // Connect to the Vercel Serverless Function
      const response = await fetch(`/api/info?url=${encodeURIComponent(url)}`);
      const result = await response.json();
      
      if (!response.ok || result.error) {
        throw new Error(result.error || "Failed to fetch video info");
      }
      
      setData(result);
      
    } catch (err: any) {
      console.error("Download Error:", err);
      setError(err.message || "Failed to connect to server.");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (data && process.env.API_KEY) {
      const analyzeTweet = async () => {
        setAnalyzing(true);
        try {
          const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });
          const prompt = `Analyze this tweet video context. Text: "${data.text}". Return JSON: {summary (max 15 words), sentiment (Pos/Neg/Neu), keywords (3 tags)}.`;
          
          const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: { responseMimeType: "application/json" }
          });
          
          if (response.text) setGeminiAnalysis(JSON.parse(response.text));
        } catch (err) {
          console.error(err);
        } finally {
          setAnalyzing(false);
        }
      };
      analyzeTweet();
    }
  }, [data]);

  const handleCopyLink = (link: string, index: number) => {
    navigator.clipboard.writeText(link);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  const toggleFaq = (index: number) => {
    setOpenFaqIndex(openFaqIndex === index ? null : index);
  };

  const navigateTo = (view: ViewState) => {
    setCurrentView(view);
    setMobileMenuOpen(false);
  };

  // --- Sub-Components ---

  const Navbar = () => (
    <nav className="border-b border-slate-200 bg-white sticky top-0 z-50 shadow-sm">
      <div className="max-w-5xl mx-auto px-4 h-16 flex items-center justify-between">
        <div 
          className="flex items-center space-x-2 cursor-pointer"
          onClick={() => navigateTo('home')}
        >
          <div className="bg-slate-900 text-white p-1.5 rounded-lg">
            <Download size={20} strokeWidth={3} />
          </div>
          <span className="text-xl font-bold text-slate-900 tracking-tight">
            X-Saver
          </span>
        </div>
        
        {/* Desktop Menu */}
        <div className="hidden md:flex items-center space-x-6 text-sm font-medium text-slate-600">
          <button onClick={() => navigateTo('home')} className={`hover:text-blue-600 ${currentView === 'home' ? 'text-blue-600' : ''}`}>Downloader</button>
          <button onClick={() => navigateTo('how-to')} className={`hover:text-blue-600 ${currentView === 'how-to' ? 'text-blue-600' : ''}`}>How to Use</button>
          <button onClick={() => navigateTo('blog')} className={`hover:text-blue-600 ${currentView === 'blog' ? 'text-blue-600' : ''}`}>Blog</button>
          <button onClick={() => navigateTo('contact')} className={`hover:text-blue-600 ${currentView === 'contact' ? 'text-blue-600' : ''}`}>Contact</button>
        </div>

        {/* Mobile Menu Toggle */}
        <div className="md:hidden">
          <button onClick={() => setMobileMenuOpen(!mobileMenuOpen)} className="p-2 text-slate-600">
            {mobileMenuOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {mobileMenuOpen && (
        <div className="md:hidden border-t border-slate-100 bg-white absolute w-full left-0 shadow-lg p-4 flex flex-col space-y-4 font-medium text-slate-600">
          <button onClick={() => navigateTo('home')} className="text-left py-2 border-b border-slate-50">Downloader</button>
          <button onClick={() => navigateTo('how-to')} className="text-left py-2 border-b border-slate-50">How to Use</button>
          <button onClick={() => navigateTo('blog')} className="text-left py-2 border-b border-slate-50">Blog</button>
          <button onClick={() => navigateTo('contact')} className="text-left py-2">Contact</button>
        </div>
      )}
    </nav>
  );

  const Footer = () => (
    <footer className="bg-slate-900 text-slate-300 py-12 mt-auto">
      <div className="max-w-5xl mx-auto px-4 grid grid-cols-2 md:grid-cols-4 gap-8 mb-8">
        {/* Brand */}
        <div className="col-span-2 md:col-span-1">
          <div className="flex items-center space-x-2 mb-4 text-white">
            <Download size={20} strokeWidth={3} />
            <span className="text-xl font-bold">X-Saver</span>
          </div>
          <p className="text-sm text-slate-400">
            The fastest and most reliable tool to download videos, GIFs, and media from X (Twitter).
          </p>
        </div>

        {/* Links Column */}
        <div>
          <h4 className="text-white font-bold mb-4">Quick Links</h4>
          <ul className="space-y-2 text-sm">
            <li><button onClick={() => navigateTo('home')} className="hover:text-white transition">Downloader</button></li>
            <li><button onClick={() => navigateTo('how-to')} className="hover:text-white transition">How to Use</button></li>
            <li><button onClick={() => navigateTo('blog')} className="hover:text-white transition">Blog</button></li>
          </ul>
        </div>

        {/* Company Column */}
        <div>
          <h4 className="text-white font-bold mb-4">Company</h4>
          <ul className="space-y-2 text-sm">
            <li><button onClick={() => navigateTo('about')} className="hover:text-white transition">About Us</button></li>
            <li><button onClick={() => navigateTo('contact')} className="hover:text-white transition">Contact Us</button></li>
          </ul>
        </div>

        {/* Legal Column */}
        <div>
          <h4 className="text-white font-bold mb-4">Legal</h4>
          <ul className="space-y-2 text-sm">
            <li><button onClick={() => navigateTo('privacy')} className="hover:text-white transition">Privacy Policy</button></li>
            <li><button onClick={() => navigateTo('terms')} className="hover:text-white transition">Terms of Service</button></li>
            <li><button onClick={() => navigateTo('legal')} className="hover:text-white transition">Legal Disclaimer</button></li>
          </ul>
        </div>
      </div>
      
      <div className="max-w-5xl mx-auto px-4 pt-8 border-t border-slate-800 text-center text-xs text-slate-500">
        &copy; {new Date().getFullYear()} X-Saver. All rights reserved. Not affiliated with X Corp.
      </div>
    </footer>
  );

  // --- Render Views ---

  const renderHome = () => (
    <>
      {/* Hero */}
      <section className="py-20 px-4 text-center bg-gradient-to-b from-blue-50/50 to-white">
        <div className="max-w-3xl mx-auto">
          <h1 className="text-4xl md:text-6xl font-extrabold mb-6 tracking-tight text-slate-900">
            Twitter Video Downloader
          </h1>
          <p className="text-lg text-slate-500 mb-10 max-w-2xl mx-auto leading-relaxed">
            Download high-quality X (Twitter) videos and GIFs directly to your device. 
            <span className="hidden sm:inline"> Supports MP4, MP3, and HD resolutions. Free & unlimited.</span>
          </p>
          
          <form onSubmit={handleDownload} className="relative max-w-2xl mx-auto shadow-2xl rounded-full flex items-center bg-white p-2 border-2 border-slate-100 focus-within:border-blue-500 transition-all hover:border-blue-300">
            <LinkIcon className="text-slate-400 ml-4 shrink-0" size={20} />
            <input
              type="text"
              placeholder="Paste tweet link here (e.g., x.com/status/...)"
              className="flex-1 bg-transparent border-none focus:ring-0 text-slate-900 placeholder-slate-400 h-12 px-4 outline-none w-full"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
            />
            {url && (
              <button 
                type="button" 
                onClick={() => setUrl('')}
                className="text-slate-300 hover:text-slate-500 p-2 mr-1"
              >
                <X size={18} />
              </button>
            )}
            <button
              type="submit"
              disabled={loading}
              className="h-12 px-8 rounded-full bg-blue-600 hover:bg-blue-700 text-white font-bold transition-all flex items-center gap-2 shrink-0 shadow-md hover:shadow-lg transform hover:-translate-y-0.5 active:translate-y-0"
            >
              {loading ? (
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              ) : (
                <>Download</>
              )}
            </button>
          </form>
          
          {error && (
            <div className="mt-6 inline-flex items-center text-red-600 bg-red-50 px-4 py-3 rounded-xl text-sm font-medium border border-red-100 animate-fade-in-up">
              <AlertCircle size={16} className="mr-2" />
              {error}
            </div>
          )}
        </div>
      </section>

      {/* Results Section */}
      {data && (
        <section className="py-12 px-4 bg-white">
          <div className="max-w-4xl mx-auto">
            <div className="bg-white rounded-2xl shadow-2xl overflow-hidden border border-slate-100 flex flex-col md:flex-row">
              
              {/* Left: Preview */}
              <div className="md:w-5/12 bg-slate-100 relative group min-h-[300px]">
                <img 
                  src={data.thumbnailUrl} 
                  alt="Video Thumbnail" 
                  className="w-full h-full object-cover"
                />
                <div className="absolute inset-0 bg-black/10 flex items-center justify-center">
                   <div className="w-16 h-16 bg-white/90 backdrop-blur rounded-full flex items-center justify-center shadow-lg transition-transform transform group-hover:scale-110">
                      <Play size={28} className="text-slate-900 ml-1" />
                   </div>
                </div>
                <div className="absolute bottom-3 right-3 bg-black/70 text-white text-xs px-2 py-1 rounded font-medium backdrop-blur-sm">
                  {data.duration}
                </div>
              </div>

              {/* Right: Info */}
              <div className="md:w-7/12 p-8 flex flex-col">
                <div className="flex items-start gap-4 mb-6">
                  <img src={data.authorAvatar} className="w-12 h-12 rounded-full border-2 border-slate-100" alt="" />
                  <div>
                    <h3 className="font-bold text-slate-900 text-lg leading-tight">{data.author}</h3>
                    <p className="text-sm text-slate-500">{data.authorHandle}</p>
                    <p className="text-slate-700 mt-2 text-sm leading-relaxed line-clamp-2">{data.text}</p>
                  </div>
                </div>

                {/* AI Badge */}
                {geminiAnalysis ? (
                  <div className="mb-6 bg-gradient-to-r from-indigo-50 to-blue-50 rounded-xl p-4 border border-indigo-100/50">
                    <div className="flex items-center gap-2 mb-2">
                      <Sparkles size={16} className="text-indigo-600" />
                      <span className="text-xs font-bold text-indigo-700 uppercase tracking-wider">AI Insight</span>
                    </div>
                    <p className="text-sm text-indigo-900 font-medium leading-snug">"{geminiAnalysis.summary}"</p>
                    <div className="mt-2 flex gap-2">
                        {geminiAnalysis.keywords.map(k => (
                            <span key={k} className="text-[10px] bg-white px-2 py-1 rounded-md text-indigo-600 border border-indigo-100 font-semibold">{k}</span>
                        ))}
                    </div>
                  </div>
                ) : (
                   analyzing && (
                    <div className="mb-6 p-4 rounded-xl border border-slate-100 bg-slate-50 flex items-center gap-3">
                        <div className="w-4 h-4 rounded-full border-2 border-slate-300 border-t-blue-500 animate-spin"></div>
                        <span className="text-sm text-slate-500 font-medium">Analyzing tweet context...</span>
                    </div>
                   )
                )}

                {/* Download List */}
                <div className="mt-auto space-y-3">
                    {data.variants.map((v, i) => (
                      <div key={i} className="flex items-center justify-between p-3 bg-slate-50 rounded-xl border border-slate-100 hover:border-blue-400 hover:bg-blue-50/50 transition-all group">
                        <div className="flex items-center gap-3">
                          <div className={`p-2.5 rounded-lg ${v.format === 'mp3' ? 'bg-purple-100 text-purple-600' : 'bg-blue-100 text-blue-600'}`}>
                            {v.format === 'mp3' ? <Music size={20} /> : <Video size={20} />}
                          </div>
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-bold text-slate-800 text-sm">{v.quality}</span>
                              <span className="text-[10px] font-bold text-slate-400 uppercase tracking-wide bg-slate-200 px-1.5 py-0.5 rounded">{v.format}</span>
                            </div>
                            <div className="text-xs text-slate-500 mt-0.5">{v.size}</div>
                          </div>
                        </div>
                        
                        <div className="flex gap-2">
                            <button 
                              onClick={() => handleCopyLink(v.url, i)}
                              className="p-2.5 text-slate-400 hover:text-blue-600 hover:bg-white rounded-lg transition-colors"
                              title="Copy Link"
                            >
                                {copiedIndex === i ? <Check size={18} /> : <Copy size={18} />}
                            </button>
                            <a 
                              href={v.url}
                              download
                              target="_blank"
                              rel="noreferrer"
                              className="bg-blue-600 hover:bg-blue-700 text-white text-xs font-bold px-5 py-2.5 rounded-lg flex items-center transition-all shadow-md hover:shadow-lg active:scale-95"
                            >
                              Download
                            </a>
                        </div>
                      </div>
                    ))}
                </div>
              </div>
            </div>
          </div>
        </section>
      )}

      {/* How It Works */}
      <section id="how-to" className="py-20 bg-white">
        <div className="max-w-5xl mx-auto px-4">
          <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">How to Download</h2>
            <p className="text-slate-500 mt-4">Save your favorite videos in 3 simple steps</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100">
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 text-xl font-bold shadow-sm">1</div>
              <h3 className="font-bold text-lg mb-2">Copy Link</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Find the video on X (Twitter), click share and copy the link.</p>
            </div>
            <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100 relative">
               <div className="hidden md:block absolute -right-4 top-1/2 -translate-y-1/2 text-slate-300 z-10">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
               </div>
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 text-xl font-bold shadow-sm">2</div>
              <h3 className="font-bold text-lg mb-2">Paste URL</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Paste the link into the search box above and hit Download.</p>
            </div>
             <div className="flex flex-col items-center text-center p-6 rounded-2xl bg-slate-50 border border-slate-100">
               <div className="hidden md:block absolute -left-4 top-1/2 -translate-y-1/2 text-slate-300 z-10">
                 <svg width="24" height="24" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2"><path d="M5 12h14m-7-7 7 7-7 7"/></svg>
               </div>
              <div className="w-16 h-16 bg-blue-100 text-blue-600 rounded-2xl flex items-center justify-center mb-6 text-xl font-bold shadow-sm">3</div>
              <h3 className="font-bold text-lg mb-2">Save Video</h3>
              <p className="text-sm text-slate-500 leading-relaxed">Select your preferred quality (HD/SD) and format (MP4/MP3).</p>
            </div>
          </div>
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="py-20 bg-slate-50 border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-4">
           <div className="text-center mb-16">
            <h2 className="text-3xl font-bold text-slate-900">Why Choose X-Saver?</h2>
            <p className="text-slate-500 mt-4">The best features for the best experience</p>
          </div>
          <div className="grid md:grid-cols-3 gap-8">
            {FEATURES.map((feature, idx) => {
               const Icon = IconMap[feature.icon] || Zap;
               return (
                <div key={idx} className="bg-white p-8 rounded-2xl shadow-sm border border-slate-100 hover:shadow-md transition-shadow">
                    <div className="w-12 h-12 bg-blue-50 text-blue-600 rounded-xl flex items-center justify-center mb-6">
                        <Icon size={24} />
                    </div>
                    <h3 className="font-bold text-lg mb-3 text-slate-900">{feature.title}</h3>
                    <p className="text-slate-500 text-sm leading-relaxed">{feature.description}</p>
                </div>
               );
            })}
          </div>
        </div>
      </section>

      {/* FAQ */}
      <section className="py-20 bg-white border-t border-slate-200">
        <div className="max-w-3xl mx-auto px-4">
          <div className="text-center mb-12">
            <h2 className="text-3xl font-bold text-slate-900">Frequently Asked Questions</h2>
          </div>
          <div className="space-y-4">
            {FAQ_ITEMS.map((item, index) => (
              <div key={index} className="border border-slate-200 rounded-xl overflow-hidden">
                <button
                  onClick={() => toggleFaq(index)}
                  className="w-full flex items-center justify-between p-5 bg-white hover:bg-slate-50 transition-colors text-left"
                >
                  <span className="font-bold text-slate-800">{item.question}</span>
                  {openFaqIndex === index ? <ChevronUp size={20} className="text-slate-400" /> : <ChevronDown size={20} className="text-slate-400" />}
                </button>
                {openFaqIndex === index && (
                  <div className="p-5 pt-0 bg-white text-slate-600 text-sm leading-relaxed border-t border-slate-100 mt-2">
                    {item.answer.split('\n').map((line, i) => <p key={i} className="mb-2 last:mb-0">{line}</p>)}
                  </div>
                )}
              </div>
            ))}
          </div>
        </div>
      </section>
    </>
  );

  const renderPage = (slug: string) => {
    // If slug is 'how-to', render Home but scroll to how-to (handled by effect or manually here, but for now reuse renderHome content usually or specialized page)
    // For this implementation, 'how-to' is a dedicated simple page similar to others for consistency with "New Page" request, 
    // OR we can just show the text content.
    // However, I made 'how-to' link to 'home' anchor in navbar, but if clicked from footer as a page, let's show a dedicated textual guide or redirect.
    // Let's treat 'how-to' as a dedicated text page for the footer link to be consistent.

    if (slug === 'how-to') {
         return (
             <div className="max-w-3xl mx-auto px-4 py-16">
                <h1 className="text-3xl font-bold mb-8 text-slate-900">How to use X-Saver</h1>
                <div className="prose prose-slate max-w-none">
                    <p className="text-lg text-slate-600 mb-8">Follow this detailed guide to download videos from X (Twitter) on any device.</p>
                    
                    <div className="space-y-12">
                        <div className="flex gap-6">
                            <div className="w-12 h-12 shrink-0 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">1</div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Find the Tweet</h3>
                                <p className="text-slate-600">Open the X app or website. Locate the tweet containing the video or GIF you want to save. Make sure the account is public.</p>
                            </div>
                        </div>
                        <div className="flex gap-6">
                            <div className="w-12 h-12 shrink-0 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">2</div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Copy the Link</h3>
                                <p className="text-slate-600">Click on the "Share" icon (arrow pointing up or connected dots) below the tweet. Select "Copy Link to Tweet" from the menu.</p>
                            </div>
                        </div>
                        <div className="flex gap-6">
                            <div className="w-12 h-12 shrink-0 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">3</div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Paste and Download</h3>
                                <p className="text-slate-600">Go to X-Saver, paste the link in the input field at the top of the page, and click the "Download" button. Wait a moment for our servers to fetch the video.</p>
                            </div>
                        </div>
                         <div className="flex gap-6">
                            <div className="w-12 h-12 shrink-0 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center font-bold text-xl">4</div>
                            <div>
                                <h3 className="text-xl font-bold mb-2">Save to Device</h3>
                                <p className="text-slate-600">A list of available qualities (1080p, 720p, etc.) will appear. Click the "Download" button next to your preferred version. On iOS, you may need to tap "Share" &gt; "Save Video" after the video opens.</p>
                            </div>
                        </div>
                    </div>
                </div>
             </div>
         )
    }

    const pageData = PAGES_CONTENT[slug];
    if (!pageData) return <div>Page not found</div>;

    return (
      <div className="max-w-3xl mx-auto px-4 py-16 min-h-[60vh]">
        <h1 className="text-3xl md:text-4xl font-bold mb-8 text-slate-900 border-b border-slate-200 pb-6">{pageData.title}</h1>
        <div 
            className="prose prose-slate prose-headings:font-bold prose-a:text-blue-600 hover:prose-a:text-blue-700 max-w-none text-slate-600"
            dangerouslySetInnerHTML={{ __html: pageData.content }}
        />
      </div>
    );
  };

  return (
    <div className="min-h-screen bg-white flex flex-col font-sans text-slate-900">
      <Navbar />
      
      <main className="flex-grow">
        {currentView === 'home' ? renderHome() : renderPage(currentView)}
      </main>

      <Footer />
    </div>
  );
}
