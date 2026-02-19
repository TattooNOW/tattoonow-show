import React, { useState, useMemo } from 'react';

/**
 * PortfolioSlide - Artist portfolio showcase
 *
 * Handles mixed aspect ratios from Instagram (4:5, 9:16, 1:1, 16:9).
 * Supports moderator-paged navigation through 15+ images.
 * Grid adapts columns based on dominant aspect ratio.
 *
 * Props:
 *   images[]     - full image array from tape media
 *   range        - [start, end] indices for this page (moderator-controlled)
 *   layout       - 'grid' | 'fullscreen'
 *   selectedImage - controlled selected image index (within the page)
 *   onSelectImage - callback for image selection
 */
export function PortfolioSlide({
  artistName,
  artistStyle,
  artistLocation,
  artistInstagram,
  images = [],
  range,
  layout = 'grid',
  selectedImage: controlledSelectedImage,
  onSelectImage
}) {
  const [localSelectedImage, setLocalSelectedImage] = useState(null);
  const selectedImage = onSelectImage ? controlledSelectedImage : localSelectedImage;

  // Determine which images to show on this page
  const pageImages = useMemo(() => {
    if (range && Array.isArray(range) && range.length === 2) {
      return images.slice(range[0], range[1] + 1);
    }
    // Legacy: show all (up to 15)
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

    // Tall content (IG portrait): fewer columns, taller cells
    if (portraitCount > landscapeCount && portraitCount >= count / 2) {
      if (count <= 3) return { cols: 3, rows: 1, style: 'portrait' };
      if (count <= 5) return { cols: 3, rows: 2, style: 'portrait' };
      return { cols: 5, rows: 2, style: 'portrait' };
    }

    // Landscape content: wider cells
    if (landscapeCount > portraitCount && landscapeCount >= count / 2) {
      if (count <= 2) return { cols: 2, rows: 1, style: 'landscape' };
      if (count <= 4) return { cols: 2, rows: 2, style: 'landscape' };
      return { cols: 3, rows: 2, style: 'landscape' };
    }

    // Mixed or square: standard grid
    if (count <= 3) return { cols: 3, rows: 1, style: 'mixed' };
    if (count <= 6) return { cols: 3, rows: 2, style: 'mixed' };
    return { cols: 5, rows: 2, style: 'mixed' };
  }, [pageImages]);

  const currentLayout = selectedImage !== null ? 'fullscreen' : (layout || 'grid');

  const handleImageClick = (pageIndex) => {
    // Pass the absolute index (page offset + position in page)
    const absoluteIndex = pageOffset + pageIndex;
    if (onSelectImage) {
      onSelectImage(absoluteIndex);
    } else {
      setLocalSelectedImage(absoluteIndex);
    }
  };

  const handleCloseFullscreen = () => {
    if (onSelectImage) {
      onSelectImage(null);
    } else {
      setLocalSelectedImage(null);
    }
  };

  // Pagination info
  const pageStart = pageOffset + 1;
  const pageEnd = pageOffset + pageImages.length;

  // Grid view
  if (currentLayout === 'grid' && selectedImage === null) {
    return (
      <div className="slideshow-container bg-background p-12">
        {/* Header */}
        <div className="mb-6">
          <h2 className="text-5xl font-bold mb-2">{artistName}</h2>
          <div className="flex items-center gap-6 text-xl text-muted-foreground">
            {artistStyle && <span>{artistStyle}</span>}
            {artistLocation && <span>• {artistLocation}</span>}
            {artistInstagram && (
              <span className="brand-accent">@{artistInstagram}</span>
            )}
          </div>
        </div>

        {/* Image grid — adapts to aspect ratio */}
        <div
          className="gap-3"
          style={{
            display: 'grid',
            gridTemplateColumns: `repeat(${gridLayout.cols}, 1fr)`,
            gridTemplateRows: gridLayout.rows > 1
              ? `repeat(${gridLayout.rows}, 1fr)`
              : '1fr',
            height: gridLayout.style === 'portrait' ? '880px' : '820px',
          }}
        >
          {pageImages.map((image, index) => (
            <div
              key={`${pageOffset}-${index}`}
              className="relative overflow-hidden rounded-lg cursor-pointer transition-transform hover:scale-[1.03] hover:z-10 border-2 border-transparent hover:border-accent"
              onClick={() => handleImageClick(index)}
            >
              <img
                src={image.url || image}
                alt={image.description || `Portfolio image ${pageOffset + index + 1}`}
                className="w-full h-full object-cover"
              />
              {image.description && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-2 text-sm">
                  {image.description}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer: page indicator + hint */}
        <div className="absolute bottom-8 left-12 right-12 flex items-center justify-between text-muted-foreground text-sm">
          <span>
            {totalImages > pageImages.length
              ? `Showing ${pageStart}–${pageEnd} of ${totalImages}`
              : `${totalImages} images`
            }
          </span>
          <span>Click image to zoom</span>
        </div>
      </div>
    );
  }

  // Fullscreen view — 90% of container, handles any aspect ratio
  if (currentLayout === 'fullscreen' && selectedImage !== null) {
    const image = images[selectedImage];
    if (!image) return null;

    return (
      <div
        className="slideshow-container bg-background flex items-center justify-center p-4"
        onClick={handleCloseFullscreen}
      >
        {/* 90% container */}
        <div
          className="relative"
          style={{
            width: '90%',
            height: '90%',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center'
          }}
        >
          <img
            src={image.url || image}
            alt={image.description || `Portfolio image ${selectedImage + 1}`}
            className="max-w-full max-h-full object-contain rounded-lg"
          />

          {/* Image description overlay */}
          {image.description && (
            <div className="absolute bottom-0 left-0 right-0 bg-black/80 p-6 rounded-b-lg">
              <p className="text-xl">{image.description}</p>
            </div>
          )}
        </div>

        {/* Artist info overlay (top) */}
        <div className="absolute top-12 left-12 bg-black/70 px-6 py-4 rounded-lg">
          <div className="text-2xl font-bold brand-accent">{artistName}</div>
          {artistInstagram && (
            <div className="text-lg text-muted-foreground">@{artistInstagram}</div>
          )}
        </div>

        {/* Navigation hints */}
        <div className="absolute bottom-12 left-1/2 transform -translate-x-1/2 text-muted-foreground text-sm">
          Click anywhere or press Space to return to grid
        </div>

        {/* Image counter — shows position in full set */}
        <div className="absolute top-12 right-12 bg-black/70 px-6 py-4 rounded-lg text-xl">
          {selectedImage + 1} / {totalImages}
        </div>
      </div>
    );
  }

  return null;
}

/**
 * Detect aspect ratio from image URL or metadata.
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
  // Instagram default
  return '4:5';
}
