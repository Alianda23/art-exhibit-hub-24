
import React, { useState } from "react";
import { zodResolver } from "@hookform/resolvers/zod";
import { useForm } from "react-hook-form";
import { z } from "zod";
import { Button } from "@/components/ui/button";
import {
  Form,
  FormControl,
  FormField,
  FormItem,
  FormLabel,
  FormMessage,
} from "@/components/ui/form";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { useToast } from "@/hooks/use-toast";
import { ArtworkData } from "@/services/api";
import { ImageUp } from "lucide-react";
import { createImageSrc, handleImageError } from "@/utils/imageUtils";

const MAX_FILE_SIZE = 5000000; // 5MB
const ACCEPTED_IMAGE_TYPES = ["image/jpeg", "image/jpg", "image/png", "image/webp"];

const artworkSchema = z.object({
  title: z.string().min(3, { message: "Title must be at least 3 characters" }),
  artist: z.string().min(3, { message: "Artist name must be at least 3 characters" }),
  description: z.string().min(10, { message: "Description must be at least 10 characters" }),
  price: z.coerce.number().min(0, { message: "Price must be a positive number" }),
  dimensions: z.string().optional(),
  medium: z.string().optional(),
  year: z.coerce.number().int().min(1000).max(new Date().getFullYear()).optional(),
  status: z.enum(["available", "sold"], { message: "Status must be available or sold" }),
});

type ArtworkFormValues = z.infer<typeof artworkSchema>;

interface ArtworkFormProps {
  initialData?: ArtworkData;
  onSubmit: (data: ArtworkData) => void;
  onCancel: () => void;
}

const ArtworkForm: React.FC<ArtworkFormProps> = ({
  initialData,
  onSubmit,
  onCancel,
}) => {
  const { toast } = useToast();
  
  // Process initial image URL if it exists
  let initialImageUrl = null;
  if (initialData?.imageUrl) {
    initialImageUrl = createImageSrc(initialData.imageUrl);
  } else if (initialData?.image_url) {
    initialImageUrl = createImageSrc(initialData.image_url);
  }
  
  const [previewImage, setPreviewImage] = useState<string | null>(initialImageUrl);
  const [imageFile, setImageFile] = useState<File | null>(null);
  
  const defaultValues = initialData || {
    title: "",
    artist: "",
    description: "",
    price: 0,
    dimensions: "",
    medium: "",
    year: new Date().getFullYear(),
    status: "available" as const,
  };

  const form = useForm<ArtworkFormValues>({
    resolver: zodResolver(artworkSchema),
    defaultValues,
  });

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    
    if (!files || files.length === 0) return;
    
    const file = files[0];
    
    // Validate file size
    if (file.size > MAX_FILE_SIZE) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Image size should be less than 5MB",
      });
      return;
    }
    
    // Validate file type
    if (!ACCEPTED_IMAGE_TYPES.includes(file.type)) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Image format should be JPG, PNG or WebP",
      });
      return;
    }
    
    setImageFile(file);
    
    // Create preview
    const reader = new FileReader();
    reader.onload = () => {
      setPreviewImage(reader.result as string);
    };
    reader.readAsDataURL(file);
  };

  const handleSubmit = async (values: ArtworkFormValues) => {
    try {
      // If no image was uploaded or changed, use the existing image
      let imageUrl = initialData?.imageUrl || initialData?.image_url || "";
      
      if (imageFile) {
        // Use the local preview data URL as the imageUrl
        imageUrl = previewImage || "";
      }
      
      // For new artworks, require an image
      if (!imageUrl && !imageFile && !initialData) {
        toast({
          variant: "destructive",
          title: "Image Required",
          description: "Please upload an image for the artwork",
        });
        return;
      }
      
      // Include the image URL in the submission data
      onSubmit({
        ...values,
        imageUrl,
        price: values.price // Price in KSh
      } as ArtworkData);
    } catch (error) {
      toast({
        variant: "destructive",
        title: "Error",
        description: "Failed to submit artwork. Please try again.",
      });
      console.error("Submit error:", error);
    }
  };

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(handleSubmit)} className="space-y-4">
        <FormField
          control={form.control}
          name="title"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Title</FormLabel>
              <FormControl>
                <Input placeholder="Artwork title" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="artist"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Artist</FormLabel>
              <FormControl>
                <Input placeholder="Artist name" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <FormField
          control={form.control}
          name="description"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Description</FormLabel>
              <FormControl>
                <Textarea placeholder="Artwork description" {...field} />
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="space-y-2">
          <FormLabel>Artwork Image</FormLabel>
          <div className="flex flex-col items-center p-4 border-2 border-dashed border-gray-300 rounded-lg">
            {previewImage && (
              <div className="mb-4 w-full max-w-xs">
                <img 
                  src={previewImage} 
                  alt="Artwork preview" 
                  className="w-full h-auto rounded-lg"
                  onError={handleImageError}
                />
              </div>
            )}
            
            <label className="w-full flex flex-col items-center px-4 py-6 bg-white rounded-lg cursor-pointer hover:bg-gray-50">
              <ImageUp className="w-8 h-8 text-gray-500" />
              <span className="mt-2 text-base text-gray-500">
                {previewImage ? "Change image" : "Upload image"}
              </span>
              <input type="file" className="hidden" onChange={handleImageChange} accept="image/*" />
            </label>
            
            {previewImage && (
              <p className="text-sm text-gray-500 mt-2">
                Click above to change the image
              </p>
            )}
          </div>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="dimensions"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Dimensions</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. 24 x 36 inches" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="medium"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Medium</FormLabel>
                <FormControl>
                  <Input placeholder="e.g. Oil on canvas" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <FormField
            control={form.control}
            name="price"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Price (KSh)</FormLabel>
                <FormControl>
                  <Input type="number" min="0" step="0.01" {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
          
          <FormField
            control={form.control}
            name="year"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Year</FormLabel>
                <FormControl>
                  <Input type="number" min="1000" max={new Date().getFullYear()} {...field} />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />
        </div>
        
        <FormField
          control={form.control}
          name="status"
          render={({ field }) => (
            <FormItem>
              <FormLabel>Status</FormLabel>
              <FormControl>
                <select 
                  className="flex h-10 w-full rounded-md border border-input bg-background px-3 py-2 text-base ring-offset-background file:border-0 file:bg-transparent file:text-sm file:font-medium placeholder:text-muted-foreground focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 disabled:cursor-not-allowed disabled:opacity-50 md:text-sm"
                  {...field}
                >
                  <option value="available">Available</option>
                  <option value="sold">Sold</option>
                </select>
              </FormControl>
              <FormMessage />
            </FormItem>
          )}
        />
        
        <div className="flex justify-end gap-2 pt-4">
          <Button type="button" variant="outline" onClick={onCancel}>
            Cancel
          </Button>
          <Button type="submit">
            {initialData ? "Update Artwork" : "Create Artwork"}
          </Button>
        </div>
      </form>
    </Form>
  );
};

export default ArtworkForm;
