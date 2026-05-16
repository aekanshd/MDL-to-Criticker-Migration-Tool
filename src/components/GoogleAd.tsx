import React, { useEffect } from "react";

declare global {
  interface Window {
    adsbygoogle?: unknown[];
  }
}

/**
 * GoogleAd placeholder component.
 * Replace ca-pub-XXXXXXXXXXXXXXXX and data-ad-slot="1234567890" with your own AdSense IDs.
 * Ads may not render locally during development.
 */
export default function GoogleAd() {
  useEffect(() => {
    try {
      if (!window.adsbygoogle) {
        window.adsbygoogle = [];
      }
      window.adsbygoogle.push({});
    } catch (error) {
      console.warn("Google AdSense initialization failed:", error);
    }
  }, []);

  return (
    <div className="w-full max-w-5xl mx-auto px-4 sm:px-6 mt-6 mb-6">
      <p className="text-[11px] tracking-[0.3em] mb-2 text-slate-400">Sponsored</p>
      <div className="w-full bg-black/20 border border-indigo-500/20 rounded-2xl backdrop-blur-md shadow-2xl shadow-indigo-900/10 overflow-hidden">
        <div className="p-3 sm:p-4">
          <div className="bg-white/5 border border-white/5 rounded-2xl p-4 min-h-[90px] sm:min-h-[120px] flex items-center justify-center">
            <ins
              className="adsbygoogle block w-full h-[90px] sm:h-[120px] rounded-2xl"
              style={{ display: "block" }}
              data-ad-client="ca-pub-XXXXXXXXXXXXXXXX"
              data-ad-slot="1234567890"
              data-ad-format="auto"
              data-full-width-responsive="true"
            />
          </div>
        </div>
      </div>
    </div>
  );
}
