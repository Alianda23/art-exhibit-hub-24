
/**
 * Utility functions for processing and displaying images
 */

// Collection of default exhibition images to use randomly
const defaultExhibitionImages = [
  "/static/uploads/exhibition_20250419211948.jpg"
];

// Default artwork image when none is provided
const defaultArtworkImage = "/static/uploads/placeholder.jpg";

// Process image URL to ensure it works with the server's structure
export const getValidImageUrl = (url: string | undefined): string => {
  // Default fallback for empty or undefined URLs
  if (!url) {
    console.log("Empty image URL, using default artwork image");
    return `http://localhost:8000${defaultArtworkImage}`;
  }
  
  // If it's already a complete URL (http/https), use it as is
  if (url.startsWith('http') || url.startsWith('https')) {
    console.log(`Using complete URL as is: ${url}`);
    return url;
  }
  
  // Handle base64 data
  if (url.startsWith('data:') || url.includes('base64')) {
    // For very long base64 strings, they might be truncated in the database
    // If they're truncated, it's better to use a placeholder
    if (url.length < 100 || !url.includes(',')) {
      console.log("Detected incomplete base64 image, using default artwork image");
      return `http://localhost:8000${defaultArtworkImage}`;
    }
    console.log("Using base64 image data");
    return url;
  }
  
  // Fix malformed URLs (a common issue with some APIs)
  if (url.includes(';//')) {
    const fixed = url.replace(';//', '://');
    console.log(`Fixed malformed URL: ${url} → ${fixed}`);
    return fixed;
  }
  
  // Handle /static/ paths by prepending server URL - crucial for both artworks and exhibitions
  if (url.startsWith('/static/')) {
    const serverUrl = `http://localhost:8000${url}`;
    console.log(`Server path for static URL: ${url} → ${serverUrl}`);
    return serverUrl;
  }
  
  // Special case for image_url from API which might not have the /static/ prefix
  if (url.includes('artwork_') || url.includes('exhibition_')) {
    const serverUrl = `http://localhost:8000/static/uploads/${url}`;
    console.log(`Added full path to artwork/exhibition filename: ${url} → ${serverUrl}`);
    return serverUrl;
  }
  
  // For other URLs that don't start with /static/, assume they need the path added
  if (!url.startsWith('/') && !url.includes('/')) {
    const serverUrl = `http://localhost:8000/static/uploads/${url}`;
    console.log(`Added full path to filename: ${url} → ${serverUrl}`);
    return serverUrl;
  }
  
  // For paths that start with / but not /static/
  if (url.startsWith('/') && !url.startsWith('/static/')) {
    const serverUrl = `http://localhost:8000${url}`;
    console.log(`Added server prefix: ${url} → ${serverUrl}`);
    return serverUrl;
  }
  
  // Fallback - use as is but warn
  console.log(`Using URL as is (default case): ${url}`);
  return url;
};

// Create a component-ready image URL with fallback
export const createImageSrc = (url: string | undefined): string => {
  try {
    const processedUrl = getValidImageUrl(url);
    console.log(`Processing image URL: ${url} → ${processedUrl}`);
    return processedUrl;
  } catch (error) {
    console.error("Error processing image URL:", error);
    return `http://localhost:8000${defaultArtworkImage}`;
  }
};

// Handle image loading errors
export const handleImageError = (e: React.SyntheticEvent<HTMLImageElement, Event>) => {
  const target = e.target as HTMLImageElement;
  console.error(`Image failed to load: ${target.src}`);
  
  // Prevent infinite loop if fallback also fails
  target.onerror = null;
  
  // Use the default artwork image as fallback
  target.src = `http://localhost:8000${defaultArtworkImage}`;
};

// Preload images to ensure they're in the browser cache
export const preloadImage = (url: string | undefined): void => {
  if (!url) return;
  
  try {
    const imageUrl = getValidImageUrl(url);
    const img = new Image();
    img.src = imageUrl;
    console.log(`Preloading image: ${imageUrl}`);
  } catch (error) {
    console.error("Error preloading image:", error);
  }
};

// Get a random exhibition image from the default collection
export const getRandomExhibitionImage = (): string => {
  const randomIndex = Math.floor(Math.random() * defaultExhibitionImages.length);
  const imagePath = defaultExhibitionImages[randomIndex];
  console.log(`Selected random exhibition image: ${imagePath}`);
  return imagePath;
};
