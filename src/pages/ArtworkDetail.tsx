
import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { Button } from '@/components/ui/button';
import { AspectRatio } from '@/components/ui/aspect-ratio';
import { formatPrice } from '@/utils/formatters';
import { createImageSrc, handleImageError } from '@/utils/imageUtils';
import { useAuth } from '@/contexts/AuthContext';
import { useToast } from '@/hooks/use-toast';
import ArtworkCard from '@/components/ArtworkCard';
import { Artwork } from '@/types';
import { getArtwork, getAllArtworks } from '@/services/api';
import { Ban } from 'lucide-react';

const ArtworkDetail = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { isAuthenticated } = useAuth();
  const { toast } = useToast();
  const [artwork, setArtwork] = useState<Artwork | null>(null);
  const [relatedArtworks, setRelatedArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchArtwork = async () => {
      if (!id) return;
      
      try {
        setLoading(true);
        const data = await getArtwork(id);
        console.log("Artwork data received:", data);
        setArtwork(data);
        
        // Fetch all artworks to get related ones by the same artist
        const allArtworks = await getAllArtworks();
        const related = allArtworks
          .filter((a: Artwork) => a.id !== id && a.artist === data.artist)
          .slice(0, 3);
        
        setRelatedArtworks(related);
      } catch (error) {
        console.error('Failed to fetch artwork:', error);
        toast({
          title: "Error",
          description: "Failed to load artwork details. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchArtwork();
  }, [id, toast]);

  const handleBuyNow = () => {
    if (!isAuthenticated) {
      toast({
        title: "Authentication Required",
        description: "Please log in to purchase artwork",
        variant: "destructive",
      });
      navigate('/login');
      return;
    }
    
    navigate(`/checkout/artwork/${id}`);
  };

  if (loading) {
    return (
      <div className="py-16 px-4 text-center">
        <h1 className="text-2xl font-semibold mb-4">Loading Artwork...</h1>
        <p className="mb-6">Please wait while we fetch the artwork details.</p>
      </div>
    );
  }

  if (!artwork) {
    return (
      <div className="py-16 px-4 text-center">
        <h1 className="text-2xl font-semibold mb-4">Artwork Not Found</h1>
        <p className="mb-6">The artwork you're looking for doesn't exist or has been removed.</p>
        <Button onClick={() => navigate('/artworks')}>
          Back to Artworks
        </Button>
      </div>
    );
  }

  // Handle image_url vs imageUrl field name differences
  const imageSource = artwork.image_url || artwork.imageUrl || null;
  const imageUrl = createImageSrc(imageSource);
  console.log(`ArtworkDetail: Image for ${artwork.title}: ${imageSource} → ${imageUrl}`);
  
  const isSold = artwork.status === 'sold';

  return (
    <div className="py-12 px-4 md:px-6 bg-secondary min-h-screen">
      <div className="container mx-auto">
        <div className="bg-white rounded-lg shadow-md overflow-hidden">
          <div className="grid md:grid-cols-2 gap-6 lg:gap-12">
            <div className="p-6 lg:p-8">
              <div className="relative">
                <AspectRatio ratio={3/4} className="overflow-hidden rounded-lg">
                  <img 
                    src={imageUrl} 
                    alt={artwork.title}
                    className="w-full h-full object-cover"
                    onError={handleImageError}
                  />
                </AspectRatio>
                {isSold && (
                  <div className="absolute top-4 right-4 bg-red-500 text-white px-4 py-2 rounded-md font-medium flex items-center gap-2">
                    <Ban className="h-5 w-5" />
                    <span>Sold</span>
                  </div>
                )}
              </div>
            </div>
            
            <div className="p-6 lg:p-8 flex flex-col">
              <h1 className="font-serif text-3xl md:text-4xl font-bold mb-2">
                {artwork.title}
              </h1>
              <p className="text-xl text-gray-600 mb-6">by {artwork.artist}</p>
              
              <div className="bg-secondary p-4 rounded-md mb-6">
                <p className="text-2xl font-medium text-gold">
                  {formatPrice(artwork.price)}
                </p>
                <p className="text-sm text-gray-500 mt-1">
                  {isSold ? 'Sold' : 'Available for Purchase'}
                </p>
              </div>
              
              <div className="grid grid-cols-2 gap-4 mb-6">
                <div>
                  <p className="text-sm text-gray-500">Dimensions</p>
                  <p className="font-medium">{artwork.dimensions}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Medium</p>
                  <p className="font-medium">{artwork.medium}</p>
                </div>
                <div>
                  <p className="text-sm text-gray-500">Year</p>
                  <p className="font-medium">{artwork.year}</p>
                </div>
              </div>
              
              <div className="mb-8">
                <h3 className="font-medium text-lg mb-2">Description</h3>
                <p className="text-gray-600">{artwork.description}</p>
              </div>
              
              <div className="mt-auto">
                <Button 
                  onClick={handleBuyNow}
                  className={`w-full py-6 text-lg ${
                    isSold 
                      ? 'bg-gray-400 hover:bg-gray-400 text-white cursor-not-allowed' 
                      : 'bg-gold hover:bg-gold-dark text-white'
                  }`}
                  disabled={isSold}
                >
                  {isSold ? 'Sold Out' : 'Buy Now'}
                </Button>
              </div>
            </div>
          </div>
        </div>
        
        {relatedArtworks.length > 0 && (
          <div className="mt-16">
            <h2 className="text-2xl font-serif font-bold mb-8">
              More by {artwork.artist}
            </h2>
            <div className="artwork-grid">
              {relatedArtworks.map((relatedArtwork) => (
                <ArtworkCard key={relatedArtwork.id} artwork={relatedArtwork} />
              ))}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default ArtworkDetail;
