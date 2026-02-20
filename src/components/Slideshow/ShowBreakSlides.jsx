import React from 'react';

/**
 * IntroSlide - "Starting Soon" / pre-show holding slide
 */
export function IntroSlide({ episodeTitle, episodeNumber, host, airDate }) {
  return (
    <div className="slideshow-container flex items-center justify-center">
      <div className="absolute inset-0 brand-gradient opacity-10" />

      <div className="relative z-10 text-center px-16 max-w-5xl">
        <div className="text-3xl text-muted-foreground mb-6 tracking-widest uppercase">
          Starting Soon
        </div>

        <div className="text-6xl font-bold mb-4">TattooNOW Weekly</div>

        <div className="brand-accent text-2xl font-semibold mb-2">
          Episode {episodeNumber}
        </div>
        <div className="text-3xl text-foreground/80 mb-8">{episodeTitle}</div>

        {host && (
          <div className="text-xl text-muted-foreground">
            with <span className="text-foreground">{host}</span>
          </div>
        )}
      </div>

      <div className="absolute top-0 left-0 w-full h-2 brand-gradient" />
      <div className="absolute bottom-0 left-0 w-full h-2 brand-gradient" />
    </div>
  );
}

/**
 * BumperSlide - Ad break / sponsor interstitial between segments
 * Shows an embedded video (left) and QR code (right)
 */
export function BumperSlide({ message, qrUrl, qrMessage, nextSegmentLabel, videoUrl }) {
  // Extract YouTube embed URL from various YouTube URL formats
  const getEmbedUrl = (url) => {
    if (!url) return null;
    const match = url.match(/(?:youtube\.com\/watch\?v=|youtu\.be\/|youtube\.com\/embed\/)([^&?#]+)/);
    if (match) return `https://www.youtube.com/embed/${match[1]}?autoplay=1&mute=1&loop=1&playlist=${match[1]}`;
    return url;
  };

  const embedUrl = getEmbedUrl(videoUrl);

  return (
    <div className="slideshow-container flex items-center justify-center">
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, rgba(234,147,32,0.08) 0%, transparent 70%)',
      }} />

      <div className="relative z-10 w-full h-full flex flex-col" style={{ padding: '40px 60px' }}>
        {/* Header */}
        <div className="text-center mb-6">
          <div className="text-lg text-muted-foreground tracking-widest uppercase mb-2">
            We'll Be Right Back
          </div>
          <div className="text-3xl font-bold">TattooNOW Weekly</div>
        </div>

        {/* Main content area — video + QR side by side */}
        <div style={{
          flex: 1,
          display: 'flex',
          gap: '40px',
          alignItems: 'center',
          justifyContent: 'center',
          minHeight: 0,
        }}>
          {/* Video embed */}
          {embedUrl && (
            <div style={{
              flex: '1 1 60%',
              maxWidth: '700px',
              aspectRatio: '16/9',
              borderRadius: '12px',
              overflow: 'hidden',
              border: '1px solid rgba(255,255,255,0.1)',
              background: '#000',
            }}>
              <iframe
                src={embedUrl}
                style={{ width: '100%', height: '100%', border: 'none' }}
                allow="autoplay; encrypted-media"
                allowFullScreen
                title="Ad break video"
              />
            </div>
          )}

          {/* QR code + message */}
          {qrUrl && (
            <div style={{
              flex: '0 0 auto',
              display: 'flex', flexDirection: 'column', alignItems: 'center',
              background: 'rgba(255,255,255,0.05)', borderRadius: '16px',
              padding: '32px 40px', border: '1px solid rgba(255,255,255,0.1)',
            }}>
              <img
                src={`https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(qrUrl)}&bgcolor=000000&color=EA9320`}
                alt="QR Code"
                style={{ width: '180px', height: '180px', marginBottom: '16px', borderRadius: '8px' }}
              />
              <div className="text-lg brand-accent font-semibold mb-1 text-center">
                {qrMessage || 'Scan to Learn More'}
              </div>
              <div className="text-xs text-muted-foreground text-center" style={{ maxWidth: '200px', wordBreak: 'break-all' }}>
                {qrUrl}
              </div>
            </div>
          )}

          {/* If no video, show message in the center instead */}
          {!embedUrl && message && (
            <div className="text-xl text-foreground/70 text-center">{message}</div>
          )}
        </div>

        {/* Footer — Coming up next */}
        {nextSegmentLabel && (
          <div className="text-center mt-6 text-lg text-muted-foreground">
            Coming up: <span className="text-foreground font-semibold">{nextSegmentLabel}</span>
          </div>
        )}
      </div>

      <div className="absolute top-0 left-0 w-full h-1 brand-gradient" />
      <div className="absolute bottom-0 left-0 w-full h-1 brand-gradient" />
    </div>
  );
}

/**
 * OutroSlide - End-of-show closing slide with CTA
 */
export function OutroSlide({ episodeTitle, episodeNumber, host, qrUrl, qrMessage }) {
  return (
    <div className="slideshow-container flex items-center justify-center">
      <div className="absolute inset-0 brand-gradient opacity-10" />

      <div className="relative z-10 text-center px-16 max-w-5xl">
        <div className="text-5xl font-bold mb-6">Thanks for Watching!</div>

        <div className="text-2xl text-muted-foreground mb-10">
          TattooNOW Weekly &mdash; Episode {episodeNumber}
        </div>

        {qrUrl && (
          <div style={{
            display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
            background: 'rgba(255,255,255,0.05)', borderRadius: '16px',
            padding: '24px 40px', border: '1px solid rgba(255,255,255,0.1)',
            marginBottom: '2rem',
          }}>
            <div className="text-xl brand-accent font-semibold mb-2">
              {qrMessage || 'Book Your Consultation'}
            </div>
            <div className="text-sm text-muted-foreground">{qrUrl}</div>
          </div>
        )}

        <div className="text-lg text-muted-foreground mt-4">
          Like, Subscribe &amp; Share
        </div>

        {host && (
          <div className="text-base text-muted-foreground mt-8">
            Hosted by <span className="brand-accent">{host}</span>
          </div>
        )}
      </div>

      <div className="absolute top-0 left-0 w-full h-2 brand-gradient" />
      <div className="absolute bottom-0 left-0 w-full h-2 brand-gradient" />
    </div>
  );
}
