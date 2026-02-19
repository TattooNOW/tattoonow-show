import React, { useState, useMemo, useEffect, useRef, useCallback } from 'react';

/**
 * PortfolioSlide - Artist portfolio showcase
 *
 * Handles mixed aspect ratios from Instagram (4:5, 9:16, 1:1, 16:9).
 * Supports moderator-paged navigation through 15+ images.
 * Grid adapts columns based on dominant aspect ratio.
 * 9:16 videos display centered with blurred background fill.
 *
 * Props:
 *   images[]       - full media array from tape (images + videos)
 *   range          - [start, end] indices for this page (moderator-controlled)
 *   layout         - 'grid' | 'fullscreen'
 *   autoAdvance    - enable 20s auto-advance through fullscreen images
 *   autoAdvanceMs  - ms per image in auto mode (default 20000)
 *   selectedImage  - controlled selected image index
 *   onSelectImage  - callback for image selection
 */
export function PortfolioSlide({
  artistName,
  artistStyle,
  artistLocation,
  artistInstagram,
  images = [],
  range,
  layout = 'grid',
  autoAdvance = false,
  autoAdvanceMs = 20000,
  selectedImage: controlledSelectedImage,
  onSelectImage
}) {
  const [localSelectedImage, setLocalSelectedImage] = useState(null);
  const selectedImage = onSelectImage ? controlledSelectedImage : localSelectedImage;
  const autoAdvanceTimer = useRef(null);

  // Determine which images to show on this page
  const pageImages = useMemo(() => {
    if (range && Array.isArray(range) && range.length === 2) {
      return images.slice(range[0], range[1] + 1);
    }
    return images.slice(0, 15);
  }, [images, range]);

  const pageOffset = range ? range[0] : 0;
  const totalImages = images.length;

  // Detect dominant aspect ratio to choose grid layout
  const gridLayout = useMemo(() => {
    const aspects = pageImages.map(img => img.aspect || detectAspect(img));
    const portraitCount = aspects.filter(a => a === '4:5' || a === '9:16').length;
    const landscapeCount = aspects.filter(a => a === '16:9').length;
    const count = pageImages.length;

    if (portraitCount > landscapeCount && portraitCount >= count / 2) {
      if (count <= 3) return { cols: 3, rows: 1, style: 'portrait' };
      if (count <= 5) return { cols: 3, rows: 2, style: 'portrait' };
      return { cols: 5, rows: 2, style: 'portrait' };
    }

    if (landscapeCount > portraitCount && landscapeCount >= count / 2) {
      if (count <= 2) return { cols: 2, rows: 1, style: 'landscape' };
      if (count <= 4) return { cols: 2, rows: 2, style: 'landscape' };
      return { cols: 3, rows: 2, style: 'landscape' };
    }

    if (count <= 3) return { cols: 3, rows: 1, style: 'mixed' };
    if (count <= 6) return { cols: 3, rows: 2, style: 'mixed' };
    return { cols: 5, rows: 2, style: 'mixed' };
  }, [pageImages]);

  const currentLayout = selectedImage !== null ? 'fullscreen' : (layout || 'grid');

  const handleImageClick = useCallback((pageIndex) => {
    const absoluteIndex = pageOffset + pageIndex;
    if (onSelectImage) {
      onSelectImage(absoluteIndex);
    } else {
      setLocalSelectedImage(absoluteIndex);
    }
  }, [pageOffset, onSelectImage]);

  const handleCloseFullscreen = useCallback(() => {
    if (onSelectImage) {
      onSelectImage(null);
    } else {
      setLocalSelectedImage(null);
    }
  }, [onSelectImage]);

  const handleNextImage = useCallback(() => {
    if (selectedImage === null) return;
    const nextIndex = selectedImage + 1;
    if (nextIndex < totalImages) {
      if (onSelectImage) {
        onSelectImage(nextIndex);
      } else {
        setLocalSelectedImage(nextIndex);
      }
    } else {
      // End of images — return to grid
      handleCloseFullscreen();
    }
  }, [selectedImage, totalImages, onSelectImage, handleCloseFullscreen]);

  // Auto-advance timer for fullscreen images (not videos)
  useEffect(() => {
    if (!autoAdvance || selectedImage === null) {
      clearInterval(autoAdvanceTimer.current);
      return;
    }

    const currentMedia = images[selectedImage];
    const isVideo = currentMedia && isVideoMedia(currentMedia);

    // Don't auto-advance videos — they have their own end/loop behavior
    if (isVideo) {
      clearInterval(autoAdvanceTimer.current);
      return;
    }

    autoAdvanceTimer.current = setTimeout(() => {
      handleNextImage();
    }, autoAdvanceMs);

    return () => clearTimeout(autoAdvanceTimer.current);
  }, [autoAdvance, autoAdvanceMs, selectedImage, images, handleNextImage]);

  // Pagination info
  const pageStart = pageOffset + 1;
  const pageEnd = pageOffset + pageImages.length;

  // ─── Grid view ───
  if (currentLayout === 'grid' && selectedImage === null) {
    return (
      <div className="slideshow-container bg-background"
        style={{ display: 'flex', flexDirection: 'column', padding: '2.5rem 3rem' }}
      >
        {/* Header */}
        <div style={{ flexShrink: 0, marginBottom: '1rem' }}>
          <h2 className="text-5xl font-bold mb-2">{artistName}</h2>
          <div className="flex items-center gap-6 text-xl text-muted-foreground">
            {artistStyle && <span>{artistStyle}</span>}
            {artistLocation && <span>• {artistLocation}</span>}
            {artistInstagram && (
              <span className="brand-accent">@{artistInstagram}</span>
            )}
          </div>
        </div>

        {/* Image grid — fills remaining space */}
        <div
          className="gap-3"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridLayout.cols}, 1fr)`,
            gridTemplateRows: gridLayout.rows > 1
              ? `repeat(${gridLayout.rows}, 1fr)`
              : '1fr',
            flex: 1,
            minHeight: 0,
          }}
        >
          {pageImages.map((media, index) => (
            <GridCell
              key={`${pageOffset}-${index}`}
              media={media}
              index={index}
              pageOffset={pageOffset}
              onClick={() => handleImageClick(index)}
            />
          ))}
        </div>

        {/* Footer: page indicator + hint */}
        <div style={{ flexShrink: 0, display: 'flex', justifyContent: 'space-between', paddingTop: '0.75rem' }}
          className="text-muted-foreground text-sm"
        >
          <span>
            {totalImages > pageImages.length
              ? `Showing ${pageStart}–${pageEnd} of ${totalImages}`
              : `${totalImages} images`
            }
          </span>
          <span>Click image to zoom{autoAdvance ? ' • Auto-advance ON' : ''}</span>
        </div>
      </div>
    );
  }

  // ─── Fullscreen view — 90% of viewport ───
  if (currentLayout === 'fullscreen' && selectedImage !== null) {
    const media = images[selectedImage];
    if (!media) return null;
    const isVideo = isVideoMedia(media);
    const aspect = media.aspect || detectAspect(media);
    const isTall = aspect === '9:16';

    return (
      <div
        className="slideshow-container flex items-center justify-center"
        style={{ background: '#050505' }}
        onClick={(e) => {
          // Don't close if clicking video controls
          if (e.target.tagName === 'VIDEO') return;
          handleCloseFullscreen();
        }}
      >
        {/* 9:16 centered layout — blurred background fill + sharp center */}
        {isTall && !isVideo && (
          <>
            {/* Blurred background fill */}
            <img
              src={media.url || media}
              alt=""
              className="absolute inset-0 w-full h-full object-cover"
              style={{ filter: 'blur(50px) brightness(0.3) saturate(1.2)' }}
            />
            {/* Sharp centered image — fills 90% of viewport height */}
            <div className="relative z-10" style={{ height: '90%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <img
                src={media.url || media}
                alt={media.description || `Portfolio image ${selectedImage + 1}`}
                style={{
                  maxHeight: '100%',
                  objectFit: 'contain',
                  borderRadius: '8px',
                  boxShadow: '0 0 80px rgba(0,0,0,0.6)',
                }}
              />
            </div>
          </>
        )}

        {/* 9:16 video — centered with blurred fill */}
        {isTall && isVideo && (
          <>
            <div
              className="absolute inset-0"
              style={{ background: 'linear-gradient(135deg, #1a1a2e 0%, #050505 100%)', opacity: 0.4 }}
            />
            {/* Video fills 90% of viewport height */}
            <div className="relative z-10" style={{ height: '90%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <VideoPlayer
                media={media}
                style={{ maxHeight: '100%', borderRadius: '8px', boxShadow: '0 0 80px rgba(0,0,0,0.6)' }}
                onEnded={autoAdvance ? handleNextImage : undefined}
              />
            </div>
          </>
        )}

        {/* Standard aspect (4:5, 1:1, 16:9) — image */}
        {!isTall && !isVideo && (
          <div
            className="relative"
            style={{ width: '90%', height: '90%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <img
              src={media.url || media}
              alt={media.description || `Portfolio image ${selectedImage + 1}`}
              style={{
                maxWidth: '100%',
                maxHeight: '100%',
                objectFit: 'contain',
                borderRadius: '8px',
                boxShadow: '0 0 60px rgba(0,0,0,0.5)',
              }}
            />
          </div>
        )}

        {/* Standard aspect — video */}
        {!isTall && isVideo && (
          <div
            className="relative"
            style={{ width: '90%', height: '90%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          >
            <VideoPlayer
              media={media}
              style={{ maxWidth: '100%', maxHeight: '100%', borderRadius: '8px', boxShadow: '0 0 60px rgba(0,0,0,0.5)' }}
              onEnded={autoAdvance ? handleNextImage : undefined}
            />
          </div>
        )}

        {/* Description overlay */}
        {media.description && (
          <div className="absolute bottom-20 left-1/2 transform -translate-x-1/2 bg-black/80 px-8 py-4 rounded-lg max-w-3xl text-center z-20"
            style={{ backdropFilter: 'blur(8px)' }}
          >
            <p className="text-xl">{media.description}</p>
          </div>
        )}

        {/* Artist info overlay (top-left) */}
        <div className="absolute top-8 left-8 bg-black/70 px-6 py-4 rounded-lg z-20"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          <div className="text-2xl font-bold brand-accent">{artistName}</div>
          {artistInstagram && (
            <div className="text-lg text-muted-foreground">@{artistInstagram}</div>
          )}
        </div>

        {/* Image counter (top-right) */}
        <div className="absolute top-8 right-8 bg-black/70 px-6 py-4 rounded-lg text-xl z-20"
          style={{ backdropFilter: 'blur(8px)' }}
        >
          {selectedImage + 1} / {totalImages}
          {autoAdvance && !isVideo && (
            <div className="text-xs text-muted-foreground mt-1">Auto {autoAdvanceMs / 1000}s</div>
          )}
        </div>

        {/* Navigation hint (bottom) */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 text-muted-foreground text-sm z-20">
          {isVideo ? 'Click outside video to return to grid' : 'Click anywhere to return to grid'}
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Grid cell — renders image thumbnail or video thumbnail
 */
function GridCell({ media, index, pageOffset, onClick }) {
  const isVideo = isVideoMedia(media);

  return (
    <div
      className="relative overflow-hidden rounded-lg cursor-pointer transition-transform hover:scale-[1.03] hover:z-10 border-2 border-transparent hover:border-accent"
      onClick={onClick}
    >
      {isVideo ? (
        <>
          {/* Video thumbnail — show first frame or poster */}
          <video
            src={media.url || media}
            className="w-full h-full object-cover"
            muted
            preload="metadata"
          />
          {/* Play icon overlay */}
          <div className="absolute inset-0 flex items-center justify-center">
            <div className="bg-black/60 rounded-full p-3">
              <svg width="32" height="32" viewBox="0 0 24 24" fill="white">
                <polygon points="5,3 19,12 5,21" />
              </svg>
            </div>
          </div>
          {media.duration && (
            <div className="absolute top-2 right-2 bg-black/70 px-2 py-1 rounded text-xs">
              {formatDuration(media.duration)}
            </div>
          )}
        </>
      ) : (
        <img
          src={media.url || media}
          alt={media.description || `Portfolio image ${pageOffset + index + 1}`}
          className="w-full h-full object-cover"
        />
      )}
      {media.description && (
        <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-sm">
          {media.description}
        </div>
      )}
    </div>
  );
}

/**
 * Video player with loop/next controls.
 * Loops by default. If onEnded provided, advances on end instead.
 */
function VideoPlayer({ media, style, onEnded }) {
  const videoRef = useRef(null);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleClick = useCallback((e) => {
    e.stopPropagation();
    if (!videoRef.current) return;
    if (videoRef.current.paused) {
      videoRef.current.play();
      setIsPlaying(true);
    } else {
      videoRef.current.pause();
      setIsPlaying(false);
    }
  }, []);

  const handleEnded = useCallback(() => {
    if (onEnded) {
      // Auto-advance mode: go to next
      onEnded();
    } else {
      // Default: loop
      if (videoRef.current) {
        videoRef.current.currentTime = 0;
        videoRef.current.play();
      }
    }
  }, [onEnded]);

  return (
    <div className="relative" style={style} onClick={handleClick}>
      <video
        ref={videoRef}
        src={media.url || media}
        style={{ width: '100%', height: '100%', objectFit: 'contain', ...style }}
        onEnded={handleEnded}
        playsInline
      />
      {/* Play/pause overlay — shows when paused */}
      {!isPlaying && (
        <div className="absolute inset-0 flex items-center justify-center bg-black/20 cursor-pointer">
          <div className="bg-black/60 rounded-full p-4">
            <svg width="48" height="48" viewBox="0 0 24 24" fill="white">
              <polygon points="5,3 19,12 5,21" />
            </svg>
          </div>
          <div className="absolute bottom-4 text-sm text-white/70">
            Click to play{onEnded ? '' : ' (loops)'}
          </div>
        </div>
      )}
      {/* Duration badge */}
      {media.duration && (
        <div className="absolute top-3 right-3 bg-black/70 px-3 py-1 rounded text-sm">
          {formatDuration(media.duration)}
        </div>
      )}
    </div>
  );
}

/**
 * Check if a media item is a video (by URL extension or explicit type)
 */
function isVideoMedia(media) {
  if (media.type === 'video') return true;
  const url = media.url || media;
  if (typeof url !== 'string') return false;
  return /\.(mp4|mov|webm|m4v)(\?|$)/i.test(url);
}

/**
 * Detect aspect ratio from image metadata.
 * Falls back to '4:5' (Instagram default) if unknown.
 */
function detectAspect(image) {
  if (image.aspect) return image.aspect;
  if (image.width && image.height) {
    const ratio = image.width / image.height;
    if (ratio > 1.5) return '16:9';
    if (ratio > 0.9) return '1:1';
    if (ratio > 0.7) return '4:5';
    return '9:16';
  }
  return '4:5';
}

/**
 * Format seconds to MM:SS
 */
function formatDuration(seconds) {
  const m = Math.floor(seconds / 60);
  const s = seconds % 60;
  return `${m}:${String(s).padStart(2, '0')}`;
}
