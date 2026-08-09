"use client";

import { useEffect } from "react";

export default function FaviconUpdater() {
  useEffect(() => {
    const updateFavicon = async () => {
      try {
        const baseUrl = process.env.NEXT_PUBLIC_API_URL 
          ? process.env.NEXT_PUBLIC_API_URL.replace(/\/$/, '')
          : 'http://127.0.0.1:8000/api';
          
        const res = await fetch(`${baseUrl}/website/site-config/`, { cache: 'no-store' });
        
        if (res.ok) {
          const data = await res.json();
          if (data?.favicon_url) {
            // Append a timestamp so the browser always fetches the latest favicon
            // This runs only once per session on initial load, so it won't impact performance
            const newFaviconUrl = `${data.favicon_url}?v=${Date.now()}`;
            
            // Update standard icon
            let link = document.querySelector("link[rel~='icon']");
            if (!link) {
              link = document.createElement('link');
              link.rel = 'icon';
              document.head.appendChild(link);
            }
            if (!link.href.includes(data.favicon_url)) {
                link.href = newFaviconUrl;
            }

            // Update apple-touch-icon
            let appleLink = document.querySelector("link[rel~='apple-touch-icon']");
            if (!appleLink) {
              appleLink = document.createElement('link');
              appleLink.rel = 'apple-touch-icon';
              document.head.appendChild(appleLink);
            }
            if (!appleLink.href.includes(data.favicon_url)) {
                appleLink.href = newFaviconUrl;
            }
          }
        }
      } catch (err) {
        console.debug("Favicon update skipped (API offline or loading):", err);
      }
    };

    updateFavicon();
  }, []);
  
  return null;
}
