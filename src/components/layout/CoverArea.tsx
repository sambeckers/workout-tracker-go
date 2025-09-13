import { useState, useRef, useCallback, useEffect } from "react";
import { Camera, Settings, Search, Upload, Move, RotateCcw, Image as ImageIcon, X, ZoomIn, ZoomOut, RotateCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogDescription } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { useToast } from "@/hooks/use-toast";
import heroImage from "@/assets/hero-fitness.jpg";

// Gallery of 32 real Unsplash fitness photos from actual photographers
const gymGallery = [
  "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1526506118085-60ce8714f8c5?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1549476464-37392f717541?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1576678927484-cc907957e67d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1594736797933-d0401ba1fe65?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1571902943202-507ec2618e8f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1550345332-09e3ac987658?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1599058917212-d750089bc07e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1584464491033-06628f3a6b7b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1593079831268-3381b0db4a77?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1544367567-0f2fcb009e0b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1567013127542-490d757e51cd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1606889464198-fcb13894be68?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1556817411-31ae72fa3ea0?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1546483624-c4f6ad89d5aa?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1582266255765-fa5cf1a1d501?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1596357395217-80de13130e92?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1506629905102-62e3ba28f564?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1574680096145-d05b474e2155?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1571019614242-c5c5dee9f50b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1583500178690-5405325c63be?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1518611012118-696072aa579a?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80",
  "https://images.unsplash.com/photo-1603988363607-e1e4a66962c6?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=300&q=80"
];

// Professional, minimal avatars (transparent BG) — DiceBear notionists-neutral
const characterAvatars = [
  "https://api.dicebear.com/7.x/notionists-neutral/svg?seed=alex&backgroundColor=f3f4f6",
  "https://api.dicebear.com/7.x/notionists-neutral/svg?seed=sam&backgroundColor=f3f4f6",
  "https://api.dicebear.com/7.x/notionists-neutral/svg?seed=chris&backgroundColor=f3f4f6",
  "https://api.dicebear.com/7.x/notionists-neutral/svg?seed=maya&backgroundColor=f3f4f6",
  "https://api.dicebear.com/7.x/notionists-neutral/svg?seed=river&backgroundColor=f3f4f6",
  "https://api.dicebear.com/7.x/notionists-neutral/svg?seed=skye&backgroundColor=f3f4f6",
  "https://api.dicebear.com/7.x/notionists-neutral/svg?seed=ash&backgroundColor=f3f4f6",
  "https://api.dicebear.com/7.x/notionists-neutral/svg?seed=blair&backgroundColor=f3f4f6",
  "https://api.dicebear.com/7.x/notionists-neutral/svg?seed=aria&backgroundColor=f3f4f6",
  "https://api.dicebear.com/7.x/notionists-neutral/svg?seed=logan&backgroundColor=f3f4f6",
  "https://api.dicebear.com/7.x/notionists-neutral/svg?seed=quinn&backgroundColor=f3f4f6",
  "https://api.dicebear.com/7.x/notionists-neutral/svg?seed=val&backgroundColor=f3f4f6"
];

const CoverArea = () => {
  const [coverImage, setCoverImage] = useState(() => {
    // Load saved cover image from localStorage or use random gym image
    const saved = localStorage.getItem('workoutTracker_coverImage');
    if (saved) return saved;
    // Pick a random gym image from gallery
    return gymGallery[Math.floor(Math.random() * gymGallery.length)];
  });
  const [avatarImage, setAvatarImage] = useState(() => {
    // Load saved avatar from localStorage
    const saved = localStorage.getItem('workoutTracker_avatarImage');
    return saved || "";
  });
  const [isUploading, setIsUploading] = useState(false);
  const [showCoverDialog, setShowCoverDialog] = useState(false);
  const [showAvatarDialog, setShowAvatarDialog] = useState(false);
  const [showCropDialog, setShowCropDialog] = useState(false);
  const [tempImageUrl, setTempImageUrl] = useState("");
  const [cropSettings, setCropSettings] = useState({
    scale: 0.5,
    rotation: 0,
    x: 0,
    y: 0
  });
  const [searchQuery, setSearchQuery] = useState("");
  const [unsplashSearchTerm, setUnsplashSearchTerm] = useState("");
  const [unsplashResults, setUnsplashResults] = useState([]);
  const [showOptionsExpanded, setShowOptionsExpanded] = useState(false);
  const [imagePosition, setImagePosition] = useState(() => {
    // Load saved image position from localStorage
    const savedPosition = localStorage.getItem('workoutTracker_imagePosition');
    return savedPosition ? JSON.parse(savedPosition) : { x: 50, y: 50 };
  });
  const [isDragging, setIsDragging] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const avatarFileInputRef = useRef<HTMLInputElement>(null);
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const { toast } = useToast();

  // Drag-to-move for crop canvas
  const [isCanvasDragging, setIsCanvasDragging] = useState(false);
  const cropDragActiveRef = useRef(false);
  const lastPointerRef = useRef<{ x: number; y: number } | null>(null);
  const clamp = (v: number, min: number, max: number) => Math.min(max, Math.max(min, v));
  const cropAutoInitDoneRef = useRef(false);

  // Function to initialize/update canvas preview immediately
  const initializeCanvasPreview = useCallback(() => {
    if (!canvasRef.current || !tempImageUrl) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const image = new Image();
    image.onload = () => {
      const size = 200;
      canvas.width = size;
      canvas.height = size;

      // Clear canvas
      ctx.clearRect(0, 0, size, size);

      // Save context
      ctx.save();

      // Create circular clipping path
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();

      // On first draw for this image, auto-fit to cover the circle
      if (!cropAutoInitDoneRef.current) {
        const coverScale = Math.max(size / image.width, size / image.height);
        const safeScale = clamp(Number(coverScale.toFixed(2)), 0.1, 3);
        cropAutoInitDoneRef.current = true;
        // Set initial settings centered
        setCropSettings(prev => ({ ...prev, scale: safeScale, x: 0, y: 0, rotation: 0 }));
      }

      // Calculate image dimensions and position with current settings
      const { scale, rotation, x, y } = cropSettings;
      const scaledWidth = image.width * scale;
      const scaledHeight = image.height * scale;
      
      // Center the image and apply user adjustments
      const centerX = size / 2 + x;
      const centerY = size / 2 + y;

      // Apply transformations
      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(
        image,
        -scaledWidth / 2,
        -scaledHeight / 2,
        scaledWidth,
        scaledHeight
      );

      // Restore context
      ctx.restore();
    };
    image.src = tempImageUrl;
  }, [tempImageUrl, cropSettings]);

  // Attach window listeners while dragging to update crop position
  useEffect(() => {
    if (!isCanvasDragging) return;

    const handleMouseMove = (e: MouseEvent) => {
      if (!cropDragActiveRef.current || !lastPointerRef.current) return;
      const dx = e.clientX - lastPointerRef.current.x;
      const dy = e.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: e.clientX, y: e.clientY };
      setCropSettings(prev => ({
        ...prev,
        x: clamp(prev.x + dx, -100, 100),
        y: clamp(prev.y + dy, -100, 100),
      }));
    };

    const handleMouseUp = () => {
      cropDragActiveRef.current = false;
      setIsCanvasDragging(false);
      lastPointerRef.current = null;
    };

    const handleTouchMove = (e: TouchEvent) => {
      if (!cropDragActiveRef.current || !lastPointerRef.current) return;
      if (e.touches.length === 0) return;
      const t = e.touches[0];
      const dx = t.clientX - lastPointerRef.current.x;
      const dy = t.clientY - lastPointerRef.current.y;
      lastPointerRef.current = { x: t.clientX, y: t.clientY };
      setCropSettings(prev => ({
        ...prev,
        x: clamp(prev.x + dx, -100, 100),
        y: clamp(prev.y + dy, -100, 100),
      }));
      e.preventDefault();
    };

    const handleTouchEnd = () => {
      cropDragActiveRef.current = false;
      setIsCanvasDragging(false);
      lastPointerRef.current = null;
    };

    window.addEventListener('mousemove', handleMouseMove, { passive: true });
    window.addEventListener('mouseup', handleMouseUp, { passive: true });
    window.addEventListener('touchmove', handleTouchMove, { passive: false });
    window.addEventListener('touchend', handleTouchEnd, { passive: true });

    return () => {
      window.removeEventListener('mousemove', handleMouseMove as any);
      window.removeEventListener('mouseup', handleMouseUp as any);
      window.removeEventListener('touchmove', handleTouchMove as any);
      window.removeEventListener('touchend', handleTouchEnd as any);
    };
  }, [isCanvasDragging]);

  const handleCanvasMouseDown = (e: React.MouseEvent<HTMLCanvasElement>) => {
    e.preventDefault();
    cropDragActiveRef.current = true;
    setIsCanvasDragging(true);
    lastPointerRef.current = { x: e.clientX, y: e.clientY };
  };

  const handleCanvasTouchStart = (e: React.TouchEvent<HTMLCanvasElement>) => {
    if (e.touches.length === 0) return;
    const t = e.touches[0];
    cropDragActiveRef.current = true;
    setIsCanvasDragging(true);
    lastPointerRef.current = { x: t.clientX, y: t.clientY };
  };

  const handleChangePosition = () => {
    setIsDragging(true);
    setShowCoverDialog(false);
    toast({
      title: "Position Mode",
      description: "Click and drag to reposition the image, then click 'Save Position'",
    });
  };

  const handleFileUpload = () => {
    fileInputRef.current?.click();
    setShowCoverDialog(false);
  };

  const handleCoverImageChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Validate file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid File Type",
          description: "Please select an image file (JPG, PNG, etc.)",
          variant: "destructive",
        });
        return;
      }

      // Validate file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File Too Large",
          description: "Please select an image smaller than 5MB",
          variant: "destructive",
        });
        return;
      }

      setIsUploading(true);
      
      // Create FileReader to convert image to data URL
      const reader = new FileReader();
      reader.onload = (e) => {
        const result = e.target?.result as string;
        setCoverImage(result);
        setIsUploading(false);
        
        // Save to localStorage for persistence
        localStorage.setItem('workoutTracker_coverImage', result);
        
        toast({
          title: "Cover Updated",
          description: "Your cover image has been successfully changed!",
        });
      };
      
      reader.onerror = () => {
        setIsUploading(false);
        toast({
          title: "Upload Failed",
          description: "Failed to process the image. Please try again.",
          variant: "destructive",
        });
      };
      
      reader.readAsDataURL(file);
    }
  };

  // Helper function to preload an image and return a promise
  const preloadImage = (url: string): Promise<string> => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      let timedOut = false;
      const timer = setTimeout(() => {
        timedOut = true;
        reject(new Error('Image load timeout'));
      }, 20000); // 20s timeout to allow slower Unsplash loads

      img.onload = () => {
        if (!timedOut) {
          clearTimeout(timer);
          resolve(url);
        }
      };
      img.onerror = () => {
        if (!timedOut) {
          clearTimeout(timer);
          reject(new Error(`Failed to load image: ${url}`));
        }
      };
      img.src = url;
    });
  };

  const searchUnsplash = async (query: string) => {
    if (!query.trim()) return;
    
    setIsUploading(true);
    setUnsplashResults([]); // Clear previous results
    
    try {
      toast({
        title: "Searching...",
        description: `Finding high-quality images for "${query}"`,
      });

      // Add a small delay to show loading state
      await new Promise(resolve => setTimeout(resolve, 500));
      
      const key = (import.meta as any).env?.VITE_UNSPLASH_ACCESS_KEY as string | undefined;
      let selectedImages: Array<{ id: string; url: string; alt: string; photographer?: string; loaded: boolean }> = [];

      if (key) {
        // Use Unsplash official JSON API when a key is present
        const apiUrl = `https://api.unsplash.com/search/photos?query=${encodeURIComponent(query + ' fitness gym workout')}&per_page=20&orientation=landscape&content_filter=high`;
        const res = await fetch(apiUrl, {
          headers: {
            Authorization: `Client-ID ${key}`,
          },
        });
        if (!res.ok) {
          throw new Error(`Unsplash API error: ${res.status}`);
        }
        const data = await res.json();
        const results = (data.results || []) as Array<any>;
        selectedImages = results.slice(0, 16).map((r: any, index: number) => ({
          id: r.id || `unsplash-${index}`,
          // Use raw with crop for consistent aspect ratio
          url: `${r.urls.raw}&w=1200&h=450&fit=crop&crop=entropy&q=80&auto=format`,
          alt: r.alt_description || r.description || `${query} image`,
          photographer: r.user?.name,
          loaded: false,
        }));
      } else {
        // Fallback: Unsplash Source API without a key
        const searchTerms = query.toLowerCase().replace(/\s+/g, ',');
        const urls: string[] = [];
        for (let i = 0; i < 16; i++) {
          const randomSeed = Date.now() + i;
          urls.push(`https://source.unsplash.com/1200x450/?${searchTerms},fitness,gym,workout&sig=${randomSeed}`);
        }
        selectedImages = urls.map((url, index) => ({
          id: `unsplash-src-${Date.now()}-${index}`,
          url,
          alt: `${query} fitness image ${index + 1}`,
          photographer: 'Unsplash',
          loaded: false,
        }));
      }
      
      // Set initial results (they'll show loading states)
      setUnsplashResults(selectedImages);
      
      toast({
        title: "Loading Images...",
        description: "Please wait while images load completely",
      });
      
  // Preload images in batches to avoid overwhelming the browser
  const batchSize = 4;
  const loadedImages: typeof selectedImages = [];
      
      for (let i = 0; i < selectedImages.length; i += batchSize) {
        const batch = selectedImages.slice(i, i + batchSize);
        
        const batchPromises = batch.map(async (image) => {
          try {
            await preloadImage(image.url);
            return { ...image, loaded: true };
          } catch (error) {
            console.warn(`Failed to load image: ${image.url}`);
            // Mark as failed; do not replace with presets to ensure real search results
            return { ...image, loaded: false };
          }
        });
        
        const loadedBatch = await Promise.allSettled(batchPromises);
        loadedBatch.forEach((result, index) => {
          if (result.status === 'fulfilled') {
            const val = result.value as typeof selectedImages[number];
            if (val.loaded) {
              loadedImages.push(val);
            }
          }
          // If not fulfilled or not loaded, we simply skip it to avoid showing presets
        });
        
        // Update results progressively
        setUnsplashResults([...loadedImages]);
        
        // Small delay between batches
        if (i + batchSize < selectedImages.length) {
          await new Promise(resolve => setTimeout(resolve, 300));
        }
      }
      
      toast({
        title: "Search Complete!",
        description: `Loaded ${loadedImages.length} high-quality images for "${query}"`,
      });
      
    } catch (error) {
      console.error('Unsplash search error:', error);
      
      // On error, keep results empty and notify user
      setUnsplashResults([]);
      toast({
        title: "Search failed",
        description: "Could not load images from Unsplash. Try again, or add an Unsplash access key.",
        variant: "destructive",
      });
    } finally {
      setIsUploading(false);
    }
  };

  const selectImage = (imageUrl: string) => {
    setCoverImage(imageUrl);
    setImagePosition({ x: 50, y: 50 }); // Reset position
    localStorage.setItem('workoutTracker_coverImage', imageUrl);
    localStorage.setItem('workoutTracker_imagePosition', JSON.stringify({ x: 50, y: 50 }));
    setShowCoverDialog(false);
    setSearchQuery(''); // Clear search query
    setUnsplashResults([]); // Clear search results
    setUnsplashSearchTerm(''); // Clear search term
    
    toast({
      title: "Cover Updated",
      description: "Your cover image has been successfully changed!",
    });
  };

  const handleImageDrag = (e: React.MouseEvent) => {
    if (!isDragging) return;
    e.preventDefault();
    e.stopPropagation();
    
    const rect = e.currentTarget.getBoundingClientRect();
    const x = ((e.clientX - rect.left) / rect.width) * 100;
    const y = ((e.clientY - rect.top) / rect.height) * 100;
    
    setImagePosition({ 
      x: Math.max(0, Math.min(100, x)), 
      y: Math.max(0, Math.min(100, y)) 
    });
  };

  const saveImagePosition = () => {
    localStorage.setItem('workoutTracker_imagePosition', JSON.stringify(imagePosition));
    setIsDragging(false);
    toast({
      title: "Position Saved",
      description: "Image position has been updated.",
    });
  };

  const cancelDrag = () => {
    setIsDragging(false);
    toast({
      title: "Cancelled",
      description: "Position change cancelled.",
    });
  };

  const handleRandomizeCover = () => {
    const randomGymImage = gymGallery[Math.floor(Math.random() * gymGallery.length)];
    setCoverImage(randomGymImage);
    setImagePosition({ x: 50, y: 50 });
    localStorage.setItem('workoutTracker_coverImage', randomGymImage);
    localStorage.setItem('workoutTracker_imagePosition', JSON.stringify({ x: 50, y: 50 }));
    toast({
      title: "Cover Randomized",
      description: "Selected a new random fitness image from our gallery!",
    });
  };

  const handleChangeAvatar = () => {
    setShowAvatarDialog(true);
  };

  const handleAvatarFileUpload = () => {
    // Reset the file input to allow selecting the same file again
    if (avatarFileInputRef.current) {
      avatarFileInputRef.current.value = '';
    }
    avatarFileInputRef.current?.click();
  };

  const handleAvatarFileChange = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file type
      if (!file.type.startsWith('image/')) {
        toast({
          title: "Invalid file",
          description: "Please select an image file.",
          variant: "destructive",
        });
        return;
      }

      // Check file size (max 5MB)
      if (file.size > 5 * 1024 * 1024) {
        toast({
          title: "File too large",
          description: "Please select an image smaller than 5MB.",
          variant: "destructive",
        });
        return;
      }

      const reader = new FileReader();
      reader.onload = (e) => {
        const imageUrl = e.target?.result as string;
        setTempImageUrl(imageUrl);
        setCropSettings({ scale: 0.5, rotation: 0, x: 0, y: 0 });
        setShowAvatarDialog(false);
        setShowCropDialog(true);
        cropAutoInitDoneRef.current = false;
        // Initialize canvas preview immediately after a small delay to ensure DOM is ready
        setTimeout(() => initializeCanvasPreview(), 50);
      };
      reader.readAsDataURL(file);
    }
  };

  // Reliable init: ensure canvas draws right after dialog mounts using rAF
  useEffect(() => {
    if (!showCropDialog) return;
    let rafA: number | null = null;
    let rafB: number | null = null;
    const tick = () => {
      if (canvasRef.current && tempImageUrl) {
        initializeCanvasPreview();
      } else {
        rafA = requestAnimationFrame(tick);
      }
    };
    rafB = requestAnimationFrame(tick);
    return () => {
      if (rafA) cancelAnimationFrame(rafA);
      if (rafB) cancelAnimationFrame(rafB);
    };
  }, [showCropDialog, tempImageUrl, initializeCanvasPreview]);

  // Live updates while sliders change
  useEffect(() => {
    if (!showCropDialog) return;
    initializeCanvasPreview();
  }, [cropSettings, showCropDialog, initializeCanvasPreview]);

  const handlePresetAvatarSelect = (avatarUrl: string) => {
    setAvatarImage(avatarUrl);
    localStorage.setItem('workoutTracker_avatarImage', avatarUrl);
    setShowAvatarDialog(false);
    toast({
      title: "Avatar updated!",
      description: "Your profile picture has been changed.",
    });
  };

  const cropImage = useCallback(() => {
    if (!canvasRef.current || !tempImageUrl) return;

    const canvas = canvasRef.current;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const image = new Image();
    image.onload = () => {
      const size = 200;
      canvas.width = size;
      canvas.height = size;

      // Clear canvas
      ctx.clearRect(0, 0, size, size);

      // Save context
      ctx.save();

      // Create circular clipping path
      ctx.beginPath();
      ctx.arc(size / 2, size / 2, size / 2, 0, Math.PI * 2);
      ctx.clip();

      // Calculate image dimensions and position
      const { scale, rotation, x, y } = cropSettings;
      const scaledWidth = image.width * scale;
      const scaledHeight = image.height * scale;
      
      // Center the image and apply user adjustments
      const centerX = size / 2 + x;
      const centerY = size / 2 + y;

      // Apply transformations
      ctx.translate(centerX, centerY);
      ctx.rotate((rotation * Math.PI) / 180);
      ctx.drawImage(
        image,
        -scaledWidth / 2,
        -scaledHeight / 2,
        scaledWidth,
        scaledHeight
      );

      // Restore context
      ctx.restore();

      // Convert to data URL
      const croppedImageUrl = canvas.toDataURL('image/png', 0.9);
      setAvatarImage(croppedImageUrl);
      localStorage.setItem('workoutTracker_avatarImage', croppedImageUrl);
      setShowCropDialog(false);
      setTempImageUrl("");
      toast({
        title: "Avatar updated!",
        description: "Your profile picture has been cropped and saved.",
      });
    };
    image.src = tempImageUrl;
  }, [tempImageUrl, cropSettings, toast]);

  const updateCropSetting = (key: keyof typeof cropSettings, value: number) => {
    setCropSettings(prev => ({ ...prev, [key]: value }));
  };

  return (
    <div className="relative">
      {/* Cover Image */}
      <div 
        className="h-48 bg-cover relative group"
        style={{ 
          backgroundImage: `linear-gradient(rgba(0,0,0,0.4), rgba(0,0,0,0.6)), url(${coverImage})`,
          backgroundPosition: `${imagePosition.x}% ${imagePosition.y}%`,
          backgroundSize: 'cover'
        }}
      >
        {/* Drag overlay - only active when in drag mode */}
        {isDragging && (
          <div
            className="absolute inset-0 cursor-move z-10"
            onMouseMove={handleImageDrag}
            onMouseDown={(e) => e.preventDefault()}
            onClick={saveImagePosition}
            style={{ touchAction: 'none' }}
          />
        )}
        {/* Cover Image Controls */}
        <div className={`absolute top-4 right-4 transition-opacity ${isDragging ? 'opacity-100' : 'opacity-0 group-hover:opacity-100'}`}>
          <div className="flex gap-2">
            {isDragging ? (
              <>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="gap-2 bg-red-500/90 text-white hover:bg-red-600"
                  onClick={cancelDrag}
                >
                  Cancel
                </Button>
                <Button 
                  variant="secondary" 
                  size="sm" 
                  className="gap-2 bg-green-500/90 text-white hover:bg-green-600"
                  onClick={saveImagePosition}
                >
                  <Move className="h-4 w-4" />
                  Save Position
                </Button>
              </>
            ) : (
              <>

                <div className="relative">
                  {!showOptionsExpanded ? (
                    <Button 
                      variant="secondary" 
                      size="sm" 
                      className="gap-2 bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 transition-all duration-300"
                      onClick={() => setShowOptionsExpanded(true)}
                      disabled={isUploading}
                    >
                      <Camera className="h-4 w-4" />
                      Change cover
                    </Button>
                  ) : (
                    <div className="flex gap-1 animate-in slide-in-from-left-2 duration-300">
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="gap-1 bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 text-xs px-2"
                        onClick={handleFileUpload}
                        disabled={isUploading}
                      >
                        <Upload className="h-3 w-3" />
                        Upload
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="gap-1 bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 text-xs px-2"
                        onClick={() => {
                          setSearchQuery('unsplash-search');
                          setShowCoverDialog(true);
                          setShowOptionsExpanded(false);
                        }}
                        disabled={isUploading}
                      >
                        <Search className="h-3 w-3" />
                        Search
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="gap-1 bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 text-xs px-2"
                        onClick={() => {
                          setSearchQuery('preset-options');
                          setShowCoverDialog(true);
                          setShowOptionsExpanded(false);
                        }}
                        disabled={isUploading}
                      >
                        <ImageIcon className="h-3 w-3" />
                        Presets
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="gap-1 bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 text-xs px-2"
                        onClick={() => {
                          setIsDragging(true);
                          setShowOptionsExpanded(false);
                        }}
                        disabled={isUploading}
                      >
                        <Move className="h-3 w-3" />
                        Position
                      </Button>
                      <Button 
                        variant="secondary" 
                        size="sm" 
                        className="gap-1 bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 text-xs px-2"
                        onClick={() => {
                          handleRandomizeCover();
                          setShowOptionsExpanded(false);
                        }}
                        disabled={isUploading}
                      >
                        <RotateCcw className="h-3 w-3" />
                        Randomize
                      </Button>
                      <Button 
                        variant="ghost" 
                        size="sm" 
                        className="gap-1 bg-white/90 dark:bg-gray-800/90 text-gray-700 dark:text-gray-300 hover:bg-white dark:hover:bg-gray-800 text-xs px-2"
                        onClick={() => setShowOptionsExpanded(false)}
                      >
                        <X className="h-3 w-3" />
                      </Button>
                    </div>
                  )}
                </div>
              </>
            )}
          </div>
        </div>

        {/* Drag instruction */}
        {isDragging && (
          <div className="absolute inset-0 flex items-center justify-center bg-black/30">
            <div className="bg-white/90 dark:bg-gray-800/90 px-4 py-2 rounded-lg text-center">
              <Move className="h-6 w-6 mx-auto mb-2" />
              <p className="text-sm font-medium">Drag to reposition image</p>
              <p className="text-xs text-muted-foreground">Click to save position</p>
            </div>
          </div>
        )}

        {/* Hidden file input */}
        <input
          ref={fileInputRef}
          type="file"
          accept="image/*"
          onChange={handleCoverImageChange}
          className="hidden"
        />

        {/* Avatar and Title - Positioned at bottom */}
        <div className="absolute bottom-4 left-8 flex items-end gap-4">
          <div className="relative">
            <Avatar className="h-12 w-12 border-3 border-white dark:border-gray-700 shadow-lg">
              <AvatarImage src={avatarImage} />
              <AvatarFallback className="bg-gradient-primary text-white text-sm font-semibold">
                SB
              </AvatarFallback>
            </Avatar>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute -bottom-1 -right-1 h-6 w-6 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 border border-gray-200 dark:border-gray-600 rounded-full"
              onClick={handleChangeAvatar}
            >
              <Camera className="h-3 w-3 text-gray-600" />
            </Button>
          </div>
          
          <div className="pb-2">
            <h1 className="text-2xl font-bold text-white drop-shadow-md">
              Workout Tracker
            </h1>
            <p className="text-white/90 text-sm drop-shadow-sm">
              Track your fitness journey with passion and energy
            </p>
          </div>
        </div>
      </div>

      {/* Subtle divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />

      {/* Cover Selection Dialog */}
      <Dialog open={showCoverDialog} onOpenChange={setShowCoverDialog}>
        <DialogContent className="max-w-4xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Change Cover Image</DialogTitle>
            <DialogDescription>
              Choose how you'd like to update your cover image
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Show Preset Gallery when selected */}
            {searchQuery === 'preset-options' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Fitness Gallery</h3>
                  <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
                    ← Back
                  </Button>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {gymGallery.map((image, index) => (
                    <div
                      key={index}
                      className="relative aspect-video rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => selectImage(image)}
                    >
                      <img
                        src={image}
                        alt={`Gym image ${index + 1}`}
                        className="w-full h-full object-cover"
                      />
                      <div className="absolute inset-0 bg-black/20 hover:bg-black/10 transition-colors" />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* Show Unsplash Search when selected */}
            {searchQuery === 'unsplash-search' && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Search Unsplash</h3>
                  <Button variant="ghost" size="sm" onClick={() => setSearchQuery('')}>
                    ← Back
                  </Button>
                </div>
                <div className="flex gap-2">
                  <Input
                    placeholder="Search for fitness, gym, workout images..."
                    value={unsplashSearchTerm}
                    onChange={(e) => setUnsplashSearchTerm(e.target.value)}
                    onKeyDown={(e) => e.key === 'Enter' && searchUnsplash(unsplashSearchTerm)}
                    autoFocus
                  />
                  <Button 
                    onClick={() => searchUnsplash(unsplashSearchTerm)}
                    disabled={isUploading || !unsplashSearchTerm.trim()}
                  >
                    <Search className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            )}

            {/* Search Results */}
            {unsplashResults.length > 0 && (
              <div className="space-y-3">
                <div className="flex items-center justify-between">
                  <h3 className="font-medium">Search Results</h3>
                  {isUploading && (
                    <div className="flex items-center gap-2 text-sm text-muted-foreground">
                      <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-primary"></div>
                      Loading images...
                    </div>
                  )}
                </div>
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
                  {unsplashResults.map((image: any) => (
                    <div
                      key={image.id}
                      className="relative aspect-video rounded-lg overflow-hidden cursor-pointer hover:scale-105 transition-transform"
                      onClick={() => image.loaded && selectImage(image.url)}
                    >
                      {!image.loaded ? (
                        <div className="w-full h-full bg-gray-200 dark:bg-gray-700 flex items-center justify-center">
                          <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-primary"></div>
                        </div>
                      ) : (
                        <>
                          <img
                            src={image.url}
                            alt={image.alt}
                            className="w-full h-full object-cover"
                            loading="lazy"
                          />
                          <div className="absolute inset-0 bg-black/20 hover:bg-black/10 transition-colors" />
                        </>
                      )}
                      {!image.loaded && (
                        <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                          <div className="text-white text-xs text-center px-2">
                            Loading...
                          </div>
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Avatar Selection Dialog */}
      <Dialog open={showAvatarDialog} onOpenChange={setShowAvatarDialog}>
        <DialogContent className="max-w-2xl">
          <DialogHeader>
            <DialogTitle>Choose Your Avatar</DialogTitle>
            <DialogDescription>
              Upload your own image or select from our fitness-themed avatars
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Upload Section */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Upload Custom Image</h3>
              <Button 
                onClick={handleAvatarFileUpload}
                variant="outline" 
                className="w-full justify-start gap-3 h-12"
              >
                <Upload className="h-4 w-4" />
                Upload from device (max 5MB)
              </Button>
            </div>

            {/* Preset Avatars */}
            <div className="space-y-3">
              <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Character Avatars</h3>
              <div className="grid grid-cols-6 gap-3">
                {characterAvatars.map((avatar, index) => (
                  <button
                    key={index}
                    onClick={() => handlePresetAvatarSelect(avatar)}
                    className="aspect-square rounded-full overflow-hidden border-2 border-transparent hover:border-primary transition-all duration-200 hover:scale-105"
                  >
                    <img 
                      src={avatar} 
                      alt={`Fitness avatar ${index + 1}`}
                      className="w-full h-full object-cover"
                    />
                  </button>
                ))}
              </div>
            </div>

            {/* Current Avatar Preview */}
            {avatarImage && (
              <div className="space-y-3">
                <h3 className="font-medium text-sm text-muted-foreground uppercase tracking-wider">Current Avatar</h3>
                <div className="flex items-center gap-3">
                  <Avatar className="h-16 w-16 border-2 border-muted">
                    <AvatarImage src={avatarImage} />
                    <AvatarFallback>SB</AvatarFallback>
                  </Avatar>
                  <div className="flex gap-2">
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={handleAvatarFileUpload}
                    >
                      <Upload className="h-4 w-4 mr-2" />
                      Upload New
                    </Button>
                    <Button 
                      variant="outline" 
                      size="sm"
                      onClick={() => {
                        setAvatarImage("");
                        localStorage.removeItem('workoutTracker_avatarImage');
                        toast({
                          title: "Avatar removed",
                          description: "Your avatar has been reset to default.",
                        });
                      }}
                    >
                      Remove
                    </Button>
                  </div>
                </div>
              </div>
            )}
          </div>
        </DialogContent>
      </Dialog>

      {/* Image Cropping Dialog */}
      <Dialog open={showCropDialog} onOpenChange={setShowCropDialog}>
        <DialogContent className="max-w-3xl">
          <DialogHeader>
            <DialogTitle>Crop & Adjust Your Avatar</DialogTitle>
            <DialogDescription>
              Adjust the position, size, and rotation of your image to fit perfectly in the circle
            </DialogDescription>
          </DialogHeader>
          
          <div className="space-y-6">
            {/* Canvas Preview */}
            <div className="flex justify-center">
              <canvas
                ref={canvasRef}
                width={200}
                height={200}
                onMouseDown={handleCanvasMouseDown}
                onTouchStart={handleCanvasTouchStart}
                className={`border-2 border-muted rounded-full bg-white dark:bg-gray-800 select-none ${isCanvasDragging ? 'cursor-grabbing' : 'cursor-grab'}`}
              />
            </div>

            {/* Controls */}
            <div className="grid grid-cols-2 gap-6">
              {/* Scale Control */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <ZoomIn className="h-4 w-4" />
                  Size: {Math.round(cropSettings.scale * 100)}%
                </label>
                <input
                  type="range"
                  min="0.1"
                  max="3"
                  step="0.1"
                  value={cropSettings.scale}
                  onChange={(e) => updateCropSetting('scale', parseFloat(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Rotation Control */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <RotateCw className="h-4 w-4" />
                  Rotation: {cropSettings.rotation}°
                </label>
                <input
                  type="range"
                  min="-180"
                  max="180"
                  step="1"
                  value={cropSettings.rotation}
                  onChange={(e) => updateCropSetting('rotation', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* X Position Control */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Move className="h-4 w-4" />
                  Horizontal: {cropSettings.x}px
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={cropSettings.x}
                  onChange={(e) => updateCropSetting('x', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>

              {/* Y Position Control */}
              <div className="space-y-2">
                <label className="text-sm font-medium flex items-center gap-2">
                  <Move className="h-4 w-4" />
                  Vertical: {cropSettings.y}px
                </label>
                <input
                  type="range"
                  min="-100"
                  max="100"
                  step="1"
                  value={cropSettings.y}
                  onChange={(e) => updateCropSetting('y', parseInt(e.target.value))}
                  className="w-full"
                />
              </div>
            </div>

            {/* Action Buttons */}
            <div className="flex justify-between">
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => setCropSettings({ scale: 0.5, rotation: 0, x: 0, y: 0 })}
                >
                  <RotateCcw className="h-4 w-4 mr-2" />
                  Reset
                </Button>
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  onClick={() => {
                    setShowCropDialog(false);
                    setShowAvatarDialog(true);
                    setTempImageUrl("");
                  }}
                >
                  Cancel
                </Button>
                <Button onClick={cropImage} className="bg-gradient-primary">
                  <Camera className="h-4 w-4 mr-2" />
                  Save Avatar
                </Button>
              </div>
            </div>
          </div>
        </DialogContent>
      </Dialog>

      {/* Hidden file inputs */}
      <input
        type="file"
        ref={fileInputRef}
        onChange={handleCoverImageChange}
        accept="image/*"
        className="hidden"
      />
      <input
        type="file"
        ref={avatarFileInputRef}
        onChange={handleAvatarFileChange}
        accept="image/*"
        className="hidden"
      />
    </div>
  );
};

export default CoverArea;