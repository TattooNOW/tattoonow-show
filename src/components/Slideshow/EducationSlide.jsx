import React from 'react';

/**
 * EducationSlide - Teaching/education content slide
 * Displays key points, stats, diagrams for educational segments
 */
export function EducationSlide({
  slideNumber,
  title,
  visual, // URL to image/chart or component
  keyPoints = [],
  stats = [],
  layout = 'split' // 'split', 'full-visual', 'text-focus'
}) {
  // Split layout: visual on left, points on right
  if (layout === 'split') {
    return (
      <div className="slideshow-container bg-background"
        style={{ display: 'flex', flexDirection: 'column', padding: '3rem 4rem' }}
      >
        {/* Slide number indicator */}
        <div className="absolute top-8 right-8 brand-accent text-lg font-semibold">
          Slide {slideNumber}
        </div>

        {/* Title */}
        <h2 className="text-6xl font-bold brand-accent" style={{ flexShrink: 0, marginBottom: '2rem' }}>{title}</h2>

        {/* Content grid */}
        <div className="grid grid-cols-2 gap-12" style={{ flex: 1, minHeight: 0 }}>
          {/* Left: Visual */}
          <div className="flex items-center justify-center bg-card rounded-lg border-2 brand-border p-8">
            {typeof visual === 'string' ? (
              <img
                src={visual}
                alt={title}
                className="max-w-full max-h-full object-contain"
              />
            ) : (
              <div className="text-4xl text-muted-foreground">
                {visual || 'Visual placeholder'}
              </div>
            )}
          </div>

          {/* Right: Key points */}
          <div className="flex flex-col justify-center">
            {keyPoints.length > 0 && (
              <ul className="space-y-6">
                {keyPoints.map((point, index) => (
                  <li key={index} className="flex items-start gap-4">
                    <span className="brand-accent text-3xl font-bold flex-shrink-0">
                      {index + 1}.
                    </span>
                    <span className="text-2xl leading-relaxed">{point}</span>
                  </li>
                ))}
              </ul>
            )}

            {stats.length > 0 && (
              <div className="mt-8 grid grid-cols-2 gap-6">
                {stats.map((stat, index) => (
                  <div
                    key={index}
                    className="bg-card rounded-lg p-6 border-l-4 brand-border"
                  >
                    <div className="text-5xl font-bold brand-accent mb-2">
                      {stat.value}
                    </div>
                    <div className="text-lg text-muted-foreground">
                      {stat.label}
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>

        {/* Footer gradient line */}
        <div className="absolute bottom-0 left-0 right-0 h-2 brand-gradient"></div>
      </div>
    );
  }

  // Full visual layout: visual takes most of screen
  if (layout === 'full-visual') {
    return (
      <div className="slideshow-container bg-background p-16">
        {/* Title overlay */}
        <div className="absolute top-16 left-16 bg-black/70 px-8 py-4 rounded-lg">
          <h2 className="text-5xl font-bold brand-accent">{title}</h2>
        </div>

        {/* Full visual */}
        <div className="w-full h-full flex items-center justify-center p-16">
          {typeof visual === 'string' ? (
            <img
              src={visual}
              alt={title}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
          ) : (
            visual
          )}
        </div>

        {/* Key points overlay at bottom */}
        {keyPoints.length > 0 && (
          <div className="absolute bottom-16 left-16 right-16 bg-black/80 px-8 py-6 rounded-lg">
            <div className="flex items-center justify-around gap-8">
              {keyPoints.map((point, index) => (
                <div key={index} className="text-xl">
                  • {point}
                </div>
              ))}
            </div>
          </div>
        )}
      </div>
    );
  }

  // Text-focus layout: minimal visual, emphasis on points
  if (layout === 'text-focus') {
    return (
      <div className="slideshow-container bg-background p-16 flex flex-col justify-center">
        {/* Title */}
        <h2 className="text-7xl font-bold mb-16 brand-accent text-center">
          {title}
        </h2>

        {/* Key points - large text */}
        {keyPoints.length > 0 && (
          <ul className="space-y-10 max-w-4xl mx-auto">
            {keyPoints.map((point, index) => (
              <li
                key={index}
                className="flex items-start gap-6 bg-card p-8 rounded-lg border-l-8 brand-border"
              >
                <span className="brand-accent text-5xl font-bold flex-shrink-0">
                  {index + 1}
                </span>
                <span className="text-4xl leading-relaxed">{point}</span>
              </li>
            ))}
          </ul>
        )}

        {/* Stats row */}
        {stats.length > 0 && (
          <div className="mt-12 flex items-center justify-center gap-12">
            {stats.map((stat, index) => (
              <div key={index} className="text-center">
                <div className="text-7xl font-bold brand-accent mb-2">
                  {stat.value}
                </div>
                <div className="text-2xl text-muted-foreground">
                  {stat.label}
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Small visual in corner if provided */}
        {visual && (
          <div className="absolute bottom-16 right-16 w-48 h-48 opacity-20">
            {typeof visual === 'string' ? (
              <img
                src={visual}
                alt={title}
                className="w-full h-full object-contain"
              />
            ) : (
              visual
            )}
          </div>
        )}
      </div>
    );
  }

  return null;
}
