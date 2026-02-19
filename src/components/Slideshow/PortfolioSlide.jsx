import React, { useState } from 'react';

/**
 * PortfolioSlide - Artist portfolio showcase
 * Supports grid view (4-6 images) and fullscreen zoom
 * Click image to zoom, Space/Enter to return to grid
 */
export function PortfolioSlide({
  artistName,
  artistStyle,
  artistLocation,
  artistInstagram,
  images = [],
  layout = 'grid', // 'grid' or 'fullscreen'
  selectedImage: controlledSelectedImage,
  onSelectImage
}) {
  // Use controlled state if provided, otherwise fall back to local state
  const [localSelectedImage, setLocalSelectedImage] = useState(null);
  const selectedImage = onSelectImage ? controlledSelectedImage : localSelectedImage;

  const currentLayout = selectedImage !== null ? 'fullscreen' : (layout || 'grid');

  const handleImageClick = (imageIndex) => {
    if (onSelectImage) {
      onSelectImage(imageIndex);
    } else {
      setLocalSelectedImage(imageIndex);
    }
  };

  const handleCloseFullscreen = () => {
    if (onSelectImage) {
      onSelectImage(null);
    } else {
      setLocalSelectedImage(null);
    }
  };

  // Grid view (contact sheet)
  if (currentLayout === 'grid' && selectedImage === null) {
    return (
      <div className="slideshow-container bg-background p-12">
        {/* Header */}
        <div className="mb-8">
          <h2 className="text-5xl font-bold mb-2">{artistName}</h2>
          <div className="flex items-center gap-6 text-xl text-muted-foreground">
            {artistStyle && <span>{artistStyle}</span>}
            {artistLocation && <span>• {artistLocation}</span>}
            {artistInstagram && (
              <span className="brand-accent">@{artistInstagram}</span>
            )}
          </div>
        </div>

        {/* Image grid */}
        <div className="grid grid-cols-3 gap-4 h-[880px]">
          {images.slice(0, 6).map((image, index) => (
            <div
              key={index}
              className="relative overflow-hidden rounded-lg cursor-pointer transition-transform hover:scale-105 hover:z-10 border-2 border-transparent hover:border-accent"
              onClick={() => handleImageClick(index)}
            >
              <img
                src={image.url || image}
                alt={image.description || `Portfolio image ${index + 1}`}
                className="w-full h-full object-cover"
              />
              {image.description && (
                <div className="absolute bottom-0 left-0 right-0 bg-black/70 p-3 text-sm">
                  {image.description}
                </div>
              )}
            </div>
          ))}
        </div>

        {/* Footer hint */}
        <div className="absolute bottom-8 right-8 text-muted-foreground text-sm">
          Click image to zoom
        </div>
      </div>
    );
  }

  // Fullscreen view
  if (currentLayout === 'fullscreen' && selectedImage !== null) {
    const image = images[selectedImage];

    return (
      <div
        className="slideshow-container bg-background flex items-center justify-center p-4"
        onClick={handleCloseFullscreen}
      >
        {/* Fullscreen image - 90% of container */}
        <div className="relative" style={{ width: '90%', height: '90%', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
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

        {/* Image counter */}
        <div className="absolute top-12 right-12 bg-black/70 px-6 py-4 rounded-lg text-xl">
          {selectedImage + 1} / {images.length}
        </div>
      </div>
    );
  }

  return null;
}
