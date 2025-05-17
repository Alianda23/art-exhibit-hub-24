
import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { getArtwork, updateArtwork } from '@/services/api';
import { useToast } from '@/hooks/use-toast';
import ArtistLayout from '@/components/ArtistLayout';
import ArtworkForm from '@/components/ArtworkForm';
import { Loader2, AlertTriangle } from 'lucide-react';

const ArtistEditArtwork = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { toast } = useToast();
  const [artwork, setArtwork] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const fetchArtwork = async () => {
      if (!id) {
        setError("No artwork ID provided");
        setLoading(false);
        return;
      }
      
      try {
        console.log(`Fetching artwork with ID: ${id}`);
        const response = await getArtwork(id);
        
        if (response.error) {
          console.error('Error response:', response.error);
          setError(response.error);
          toast({
            title: "Error",
            description: response.error || "Failed to fetch artwork details.",
            variant: "destructive",
          });
        } else if (response.artwork) {
          console.log('Artwork data received:', response.artwork);
          setArtwork(response.artwork);
        } else {
          console.error('Unexpected response format:', response);
          setError("Invalid response from server");
          toast({
            title: "Error",
            description: "Received an invalid response format from the server.",
            variant: "destructive",
          });
        }
      } catch (error) {
        console.error('Error fetching artwork:', error);
        setError("Failed to fetch artwork");
        toast({
          title: "Error",
          description: "Failed to fetch artwork details. Please try again.",
          variant: "destructive",
        });
      } finally {
        setLoading(false);
      }
    };

    fetchArtwork();
  }, [id, toast]);

  const handleSubmit = async (data: any) => {
    if (!id) return;
    
    try {
      const response = await updateArtwork(id, data);
      
      if (response.error) {
        toast({
          title: "Error",
          description: response.error || "Failed to update artwork.",
          variant: "destructive",
        });
      } else {
        toast({
          title: "Success",
          description: "Artwork updated successfully.",
        });
        navigate('/artist/artworks');
      }
    } catch (error) {
      console.error('Error updating artwork:', error);
      toast({
        title: "Error",
        description: "Failed to update artwork. Please try again.",
        variant: "destructive",
      });
    }
  };

  const handleCancel = () => {
    navigate('/artist/artworks');
  };

  if (loading) {
    return (
      <ArtistLayout>
        <div className="flex justify-center items-center h-64">
          <Loader2 className="h-8 w-8 animate-spin text-primary" />
        </div>
      </ArtistLayout>
    );
  }

  return (
    <ArtistLayout>
      <div className="space-y-6">
        <h1 className="text-3xl font-bold">Edit Artwork</h1>
        
        {error ? (
          <div className="bg-red-50 border border-red-200 rounded-md p-4 flex items-start">
            <AlertTriangle className="h-5 w-5 text-red-500 mr-2 mt-0.5" />
            <div>
              <p className="text-red-800 font-medium">Error</p>
              <p className="text-red-700">{error}</p>
              <button 
                onClick={() => navigate('/artist/artworks')}
                className="mt-2 text-sm text-red-600 hover:text-red-800 font-medium"
              >
                Return to artworks
              </button>
            </div>
          </div>
        ) : artwork ? (
          <ArtworkForm
            initialData={artwork}
            onSubmit={handleSubmit}
            onCancel={handleCancel}
          />
        ) : (
          <div className="text-center p-8">
            <p className="text-gray-500">Artwork not found.</p>
            <button 
              onClick={() => navigate('/artist/artworks')}
              className="mt-4 text-sm text-primary hover:underline font-medium"
            >
              Return to artworks
            </button>
          </div>
        )}
      </div>
    </ArtistLayout>
  );
};

export default ArtistEditArtwork;
