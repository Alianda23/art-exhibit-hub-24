
import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { ArrowRight, Sparkles } from 'lucide-react';
import { Button } from '@/components/ui/button';
import ArtworkCard from '@/components/ArtworkCard';
import { getAllArtworks } from '@/services/api';
import { Artwork } from '@/types';
import { useToast } from '@/hooks/use-toast';

const ArtworkRecommendations = () => {
  const [recommendedArtworks, setRecommendedArtworks] = useState<Artwork[]>([]);
  const [loading, setLoading] = useState(true);
  const [userPreferences, setUserPreferences] = useState<string[]>(() => {
    // Try to get user preferences from localStorage
    const savedPreferences = localStorage.getItem('artPreferences');
    return savedPreferences ? JSON.parse(savedPreferences) : ['contemporary', 'abstract'];
  });
  const { toast } = useToast();

  useEffect(() => {
    const fetchAndGenerateRecommendations = async () => {
      try {
        setLoading(true);
        const allArtworks = await getAllArtworks();
        console.log("Fetched artworks for recommendations:", allArtworks.length);
        
        // Generate AI recommendations from all artworks
        const recommendations = generateAIRecommendations(allArtworks);
        setRecommendedArtworks(recommendations);
      } catch (error) {
        console.error('Failed to fetch artwork recommendations:', error);
        toast({
          title: "Error",
          description: "Failed to load artwork recommendations. Please try again later.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };
    
    fetchAndGenerateRecommendations();
  }, [toast, userPreferences]);

  // AI-based recommendation algorithm that determines trends and user preferences
  const generateAIRecommendations = (artworks: Artwork[]): Artwork[] => {
    console.log("Generating AI-powered recommendations");
    
    if (artworks.length <= 3) {
      return artworks;
    }
    
    // Get trending artworks (we'll use a simple algorithm for this demo)
    // In a real app, this would be based on view counts, purchase history, etc.
    const trending = identifyTrendingArtworks(artworks);
    
    // Get personalized recommendations based on user preferences
    const personalized = personalizeRecommendations(artworks, userPreferences);
    
    // Combine trending and personalized with priority on personalized
    const combined = [...personalized];
    
    // Add trending items that aren't already in the personalized list
    trending.forEach(artwork => {
      if (!combined.some(item => item.id === artwork.id) && combined.length < 3) {
        combined.push(artwork);
      }
    });
    
    // If we still don't have 3 recommendations, add random ones
    if (combined.length < 3) {
      const remaining = artworks.filter(artwork => 
        !combined.some(item => item.id === artwork.id)
      );
      
      const shuffled = [...remaining].sort(() => 0.5 - Math.random());
      while (combined.length < 3 && shuffled.length > 0) {
        combined.push(shuffled.pop()!);
      }
    }
    
    // Ensure we only return max 3 recommendations
    return combined.slice(0, 3);
  };

  // Function to identify trending artworks based on characteristics
  const identifyTrendingArtworks = (artworks: Artwork[]): Artwork[] => {
    // This is a simplified version - in a real app, this would use actual analytics
    // Algorithm: weight artworks by recency, popularity factors, and current art trends
    
    const weighted = artworks.map(artwork => {
      let score = 0;
      
      // Higher score for newer artworks
      if (artwork.year) {
        // Convert year to string before parsing to ensure type safety
        const yearString = String(artwork.year);
        const year = parseInt(yearString);
        if (!isNaN(year) && year > 2020) {
          score += 10;
        } else if (!isNaN(year) && year > 2010) {
          score += 5;
        }
      }
      
      // Higher score for trending mediums (simplified trend analysis)
      const trendingMediums = ['digital', 'mixed media', 'acrylic'];
      if (artwork.medium && trendingMediums.some(medium => 
        artwork.medium.toLowerCase().includes(medium.toLowerCase()))) {
        score += 8;
      }
      
      // Higher score for certain keywords in title or description
      const trendingKeywords = ['abstract', 'contemporary', 'modern', 'innovative'];
      const textContent = `${artwork.title} ${artwork.description || ''}`.toLowerCase();
      
      trendingKeywords.forEach(keyword => {
        if (textContent.includes(keyword.toLowerCase())) {
          score += 5;
        }
      });
      
      return { artwork, score };
    });
    
    // Sort by score and take top items
    return weighted
      .sort((a, b) => b.score - a.score)
      .map(item => item.artwork)
      .slice(0, 3);
  };

  // Function to personalize recommendations based on user preferences
  const personalizeRecommendations = (artworks: Artwork[], preferences: string[]): Artwork[] => {
    // This would normally be based on user history, likes, purchases, etc.
    // Here we'll use the preferences array to match keywords
    
    const scored = artworks.map(artwork => {
      let score = 0;
      const textContent = `${artwork.title} ${artwork.description || ''} ${artwork.medium || ''} ${artwork.artist || ''}`.toLowerCase();
      
      // Score by matching preferences
      preferences.forEach(pref => {
        if (textContent.includes(pref.toLowerCase())) {
          score += 10;
        }
      });
      
      return { artwork, score };
    });
    
    // Sort by score and take top items
    return scored
      .sort((a, b) => b.score - a.score)
      .map(item => item.artwork)
      .slice(0, 2); // Get fewer personalized to leave room for trending
  };

  return (
    <section className="py-20 bg-secondary">
      <div className="container mx-auto px-4 md:px-6">
        <div className="flex justify-between items-center mb-12">
          <div className="flex items-center gap-2">
            <Sparkles className="h-6 w-6 text-gold" />
            <h2 className="text-3xl md:text-4xl font-serif font-bold">
              AI-Powered <span className="text-gold">Recommendations</span>
            </h2>
          </div>
          <Link to="/artworks">
            <Button variant="ghost" className="text-gold hover:text-gold-dark flex items-center gap-2">
              View All <ArrowRight className="h-4 w-4" />
            </Button>
          </Link>
        </div>
        
        <div className="artwork-grid">
          {loading ? (
            <p className="text-center w-full">Loading personalized recommendations...</p>
          ) : recommendedArtworks.length > 0 ? (
            recommendedArtworks.map((artwork) => (
              <ArtworkCard key={artwork.id} artwork={artwork} />
            ))
          ) : (
            <p className="text-center w-full">No recommendations found. Please check back later.</p>
          )}
        </div>
      </div>
    </section>
  );
};

export default ArtworkRecommendations;
