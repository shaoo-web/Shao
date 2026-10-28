import { useEffect, useState, useRef } from 'react';
import { getActiveAdsBySlot, recordAdImpression, recordAdClick } from '../lib/api.js';

function ScriptAdRenderer({ ad, onAdClick }) {
  const containerRef = useRef(null);

  useEffect(() => {
    const container = containerRef.current;
    if (!container || !ad?.script_code) return;

    // Clear previous content
    container.innerHTML = '';

    // Parse raw HTML/JS and recreate <script> tags via document.createElement('script')
    const temp = document.createElement('div');
    temp.innerHTML = ad.script_code;

    const scripts = temp.querySelectorAll('script');
    scripts.forEach((oldScript) => {
      const newScript = document.createElement('script');
      Array.from(oldScript.attributes).forEach((attr) => {
        newScript.setAttribute(attr.name, attr.value);
      });
      if (oldScript.textContent) {
        newScript.textContent = oldScript.textContent;
      }
      oldScript.parentNode.replaceChild(newScript, oldScript);
    });

    while (temp.firstChild) {
      container.appendChild(temp.firstChild);
    }
  }, [ad?.script_code]);

  return (
    <div
      ref={containerRef}
      onClick={() => onAdClick(ad)}
      style={{
        width: ad.width ? `${ad.width}px` : '100%',
        minHeight: ad.height ? `${ad.height}px` : 'auto',
      }}
      className="w-full flex justify-center items-center overflow-hidden"
    />
  );
}

export default function AdSlot({ slot, className = '' }) {
  const [ads, setAds] = useState([]);
  const [loading, setLoading] = useState(true);
  const impressionsTracked = useRef(new Set());

  useEffect(() => {
    let isMounted = true;

    async function fetchAds() {
      try {
        const data = await getActiveAdsBySlot(slot);
        if (isMounted) {
          setAds(data || []);
        }
      } catch (err) {
        console.warn(`Failed to fetch ads for slot "${slot}":`, err);
      } finally {
        if (isMounted) setLoading(false);
      }
    }

    fetchAds();

    return () => {
      isMounted = false;
    };
  }, [slot]);

  // Count impressions once per ad mount
  useEffect(() => {
    ads.forEach((ad) => {
      if (ad?.id && !impressionsTracked.current.has(ad.id)) {
        impressionsTracked.current.add(ad.id);
        recordAdImpression(ad.id);
      }
    });
  }, [ads]);

  if (loading || ads.length === 0) {
    return null;
  }

  const handleAdClick = (ad) => {
    if (ad?.id) {
      recordAdClick(ad.id);
    }
  };

  return (
    <div className={`theara-ad-slot my-4 flex flex-col items-center justify-center gap-3 ${className}`}>
      <div className="w-full text-center">
        <span className="text-[10px] tracking-widest uppercase text-slate-400 block">
          Advertisement
        </span>
      </div>

      {ads.map((ad) => {
        if (ad.ad_type === 'image' && ad.image_url) {
          return (
            <a
              key={ad.id}
              href={ad.link_url || '#'}
              target={ad.link_url ? '_blank' : '_self'}
              rel="noopener noreferrer"
              onClick={() => handleAdClick(ad)}
              className="inline-block transition-opacity hover:opacity-95 overflow-hidden rounded-lg border border-slate-200 dark:border-slate-800"
              style={{
                maxWidth: ad.width ? `${ad.width}px` : '100%',
                maxHeight: ad.height ? `${ad.height}px` : 'auto',
              }}
            >
              <img
                src={ad.image_url}
                alt={ad.name || 'Sponsored Advertisement'}
                width={ad.width || undefined}
                height={ad.height || undefined}
                className="w-full h-auto object-cover block"
                loading="lazy"
              />
            </a>
          );
        }

        if (ad.ad_type === 'script' && ad.script_code) {
          return <ScriptAdRenderer key={ad.id} ad={ad} onAdClick={handleAdClick} />;
        }

        return null;
      })}
    </div>
  );
}
