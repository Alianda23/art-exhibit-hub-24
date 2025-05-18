
import React from 'react';
import { Link } from 'react-router-dom';
import { Artwork } from '@/types';
import { formatPrice } from '@/utils/formatters';
import { createImageSrc, handleImageError } from '@/utils/imageUtils';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { Ban } from 'lucide-react';

interface ArtworkCardProps {
  artwork: Artwork;
}

const ArtworkCard = ({ artwork }: ArtworkCardProps) => {
  // Process the image URL before rendering - using imageUrl property directly
  const imageUrl = createImageSrc(artwork.imageUrl);
  console.log(`ArtworkCard: Loading image for ${artwork.title}: ${artwork.imageUrl} → ${imageUrl}`);
  
  return (
    <div className="group rounded-lg overflow-hidden bg-white shadow-md hover:shadow-lg transition-all duration-300">
      <div className="image-container relative">
        <AspectRatio ratio={3/4}>
          <img
            src={imageUrl}
            alt={artwork.title}
            className="w-full h-full object-cover"
            onError={handleImageError}
          />
        </AspectRatio>
        {artwork.status === 'sold' && (
          <div className="absolute top-0 right-0 bg-red-500 text-white px-3 py-1 rounded-bl-lg font-medium flex items-center gap-1">
            <Ban className="h-4 w-4" />
            <span>Sold</span>
          </div>
        )}
      </div>
      <div className="p-4">
        <h3 className="font-serif text-xl font-semibold mb-1 group-hover:text-gold transition-colors">
          {artwork.title}
        </h3>
        <p className="text-gray-600 mb-2">by {artwork.artist}</p>
        <p className="font-medium text-lg text-gold mb-3">
          {formatPrice(artwork.price)}
        </p>
        <div className="text-gray-700 text-sm mb-4">
          <p>{artwork.dimensions} | {artwork.medium}</p>
        </div>
        <Link to={`/artworks/${artwork.id}`}>
          <Button className="w-full bg-gold hover:bg-gold-dark text-white">
            View Details
          </Button>
        </Link>
      </div>
    </div>
  );
};

export default ArtworkCard;
