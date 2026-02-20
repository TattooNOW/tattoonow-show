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
 */
export function BumperSlide({ message, qrUrl, qrMessage, nextSegmentLabel }) {
  return (
    <div className="slideshow-container flex items-center justify-center">
      <div className="absolute inset-0" style={{
        background: 'radial-gradient(ellipse at center, rgba(234,147,32,0.08) 0%, transparent 70%)',
      }} />

      <div className="relative z-10 text-center px-16 max-w-4xl">
        <div className="text-2xl text-muted-foreground mb-8 tracking-widest uppercase">
          We'll Be Right Back
        </div>

        <div className="text-5xl font-bold mb-10">TattooNOW Weekly</div>

        {message && (
          <div className="text-xl text-foreground/70 mb-8">{message}</div>
        )}

        {qrUrl && (
          <div style={{
            display: 'inline-flex', flexDirection: 'column', alignItems: 'center',
            background: 'rgba(255,255,255,0.05)', borderRadius: '16px',
            padding: '24px 32px', border: '1px solid rgba(255,255,255,0.1)',
          }}>
            <div className="text-lg brand-accent font-semibold mb-2">
              {qrMessage || 'Scan to Learn More'}
            </div>
            <div className="text-sm text-muted-foreground">{qrUrl}</div>
          </div>
        )}

        {nextSegmentLabel && (
          <div className="mt-12 text-lg text-muted-foreground">
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
