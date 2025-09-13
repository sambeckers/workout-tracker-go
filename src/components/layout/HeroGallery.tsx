import { useState, useEffect, useCallback } from "react";
import { ChevronLeft, ChevronRight, Plus } from "lucide-react";
import { Button } from "@/components/ui/button";

// Gallery categories with high-quality Unsplash images
const galleryImages = {
  fitness: [
    "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
    "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
    "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
    "https://images.unsplash.com/photo-1540497077202-7c8a3999166f?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
    "https://images.unsplash.com/photo-1549060279-7e168fcee0c2?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
    "https://images.unsplash.com/photo-1581009146145-b5ef050c2e1e?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
    "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
  ],
  running: [
    "https://images.unsplash.com/photo-1544967882-f61bb013a311?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
    "https://images.unsplash.com/photo-1605296867304-46d5465a13f1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
    "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
    "https://images.unsplash.com/photo-1506629905102-62e3ba28f564?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
    "https://images.unsplash.com/photo-1571008887538-b36bb32f4571?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
    "https://images.unsplash.com/photo-1594736797933-d0401ba1fe65?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
    "https://images.unsplash.com/photo-1558618666-fcd25c85cd64?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
  ],
  mountains: [
    "https://images.unsplash.com/photo-1506905925346-21bda4d32df4?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
    "https://images.unsplash.com/photo-1464822759844-d150e494af2d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
    "https://images.unsplash.com/photo-1486915309851-b0cc1f8a0084?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
    "https://images.unsplash.com/photo-1551632811-561732d1e306?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
    "https://images.unsplash.com/photo-1518837695005-2083093ee35b?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
    "https://images.unsplash.com/photo-1500534314209-a25ddb2bd429?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
    "https://images.unsplash.com/photo-1506197603052-3cc9c3a201bd?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&h=800&q=80",
  ]
};

// Combine all images into a single array
const allImages = [
  ...galleryImages.fitness,
  ...galleryImages.running,
  ...galleryImages.mountains,
];

interface HeroGalleryProps {
  userName: string;
  onStartWorkout: () => void;
}

const HeroGallery = ({ userName, onStartWorkout }: HeroGalleryProps) => {
  const [currentImageIndex, setCurrentImageIndex] = useState(() => {
    // Load saved index from localStorage or start with 0
    const saved = localStorage.getItem('workoutTracker_heroImageIndex');
    return saved ? parseInt(saved, 10) : 0;
  });

  const [isImageLoaded, setIsImageLoaded] = useState(false);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());

  // Save current image index to localStorage
  useEffect(() => {
    localStorage.setItem('workoutTracker_heroImageIndex', currentImageIndex.toString());
  }, [currentImageIndex]);

  // Preload next few images for smoother transitions
  useEffect(() => {
    // Preload current image immediately
    setIsImageLoaded(false);
    const currentImg = new Image();
    currentImg.onload = () => setIsImageLoaded(true);
    currentImg.src = allImages[currentImageIndex];
    
    // Preload next 2 images
    for (let i = 1; i <= 2; i++) {
      const nextIndex = (currentImageIndex + i) % allImages.length;
      if (!failedImages.has(nextIndex)) {
        const img = new Image();
        img.src = allImages[nextIndex];
      }
    }
  }, [currentImageIndex, failedImages]);

  const nextImage = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsImageLoaded(false);
    setCurrentImageIndex((prev) => (prev + 1) % allImages.length);
  }, []);

  const previousImage = useCallback((e?: React.MouseEvent) => {
    if (e) {
      e.preventDefault();
      e.stopPropagation();
    }
    setIsImageLoaded(false);
    setCurrentImageIndex((prev) => (prev - 1 + allImages.length) % allImages.length);
  }, []);

  const handleImageLoad = () => {
    setIsImageLoaded(true);
  };

  const handleImageError = () => {
    console.warn(`Failed to load image: ${allImages[currentImageIndex]}`);
    // Mark this image as failed and try next one
    setFailedImages(prev => new Set(prev).add(currentImageIndex));
    
    // Find next working image
    let nextIndex = (currentImageIndex + 1) % allImages.length;
    let attempts = 0;
    while (failedImages.has(nextIndex) && attempts < allImages.length) {
      nextIndex = (nextIndex + 1) % allImages.length;
      attempts++;
    }
    
    if (attempts < allImages.length) {
      setTimeout(() => setCurrentImageIndex(nextIndex), 500);
    }
  };

  // Auto-advance images every 8 seconds (reduced for better UX)
  useEffect(() => {
    const interval = setInterval(() => nextImage(), 8000);
    return () => clearInterval(interval);
  }, [nextImage]);

  return (
    <div className="flex flex-col lg:flex-row gap-3 md:gap-4">
      {/* Square Hero Gallery - Left Aligned */}
      <div className="relative w-full lg:w-80 h-80 rounded-xl overflow-hidden shadow-lg group">
        <div 
          className="absolute inset-0 bg-cover bg-center transition-all duration-500 ease-in-out bg-gradient-primary"
          style={{ 
            backgroundImage: `linear-gradient(rgba(0,0,0,0.6), rgba(0,0,0,0.4)), url(${allImages[currentImageIndex]})`,
            opacity: isImageLoaded ? 1 : 0.8
          }}
        >
          {/* Hidden image for preloading and error handling */}
          <img
            src={allImages[currentImageIndex]}
            alt="Hero background"
            className="hidden"
            onLoad={handleImageLoad}
            onError={handleImageError}
          />
          
          {/* Navigation Controls */}
          <button
            onClick={previousImage}
            className="absolute left-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
            aria-label="Previous image"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          <button
            onClick={nextImage}
            className="absolute right-2 top-1/2 transform -translate-y-1/2 bg-black/30 hover:bg-black/50 text-white rounded-full p-2 opacity-0 group-hover:opacity-100 transition-opacity duration-300 z-10"
            aria-label="Next image"
          >
            <ChevronRight className="h-4 w-4" />
          </button>

          {/* Hero Content */}
          <div className="absolute inset-0 flex items-start justify-start">
            <div className="text-left text-white p-4 pt-6">
              <h1 className="text-2xl md:text-3xl font-bold leading-tight mb-3" style={{ textShadow: '2px 2px 4px rgba(0,0,0,0.8)' }}>
                Welcome back,<br />
                <span className="text-primary font-extrabold" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.4)' }}>{userName}</span>
              </h1>
              <p className="text-sm md:text-base opacity-90 max-w-xs mb-4" style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)' }}>
                Ready for your next workout?
              </p>
              <Button 
                variant="hero" 
                size="sm" 
                className="mt-1"
                onClick={onStartWorkout}
              >
                <Plus className="mr-1 h-3 w-3" />
                Start Workout
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Additional Content Area - Right Side */}
      <div className="flex-1 min-h-80 lg:min-h-0">
        <div className="h-full bg-gradient-card rounded-xl p-4 shadow-lg border-0 flex flex-col justify-center">
          <div className="space-y-4">
            <div>
              <h2 className="text-xl font-bold text-foreground mb-1">Your Fitness Journey</h2>
              <p className="text-sm text-muted-foreground">
                Track progress, set goals, and stay motivated.
              </p>
            </div>
            
            <div className="grid grid-cols-2 gap-3">
              <div className="text-center p-3 bg-primary/10 rounded-lg">
                <div className="text-xl font-bold text-primary">0</div>
                <div className="text-xs text-muted-foreground">Workouts</div>
              </div>
              <div className="text-center p-3 bg-secondary/10 rounded-lg">
                <div className="text-xl font-bold text-secondary">0</div>
                <div className="text-xs text-muted-foreground">Goals</div>
              </div>
            </div>

            <div className="space-y-2">
              <h3 className="text-sm font-semibold text-foreground">Quick Actions</h3>
              <div className="grid grid-cols-1 gap-1">
                <Button variant="outline" size="sm" className="justify-start text-xs h-8">
                  Schedule Workout
                </Button>
                <Button variant="outline" size="sm" className="justify-start text-xs h-8">
                  View Progress
                </Button>
                <Button variant="outline" size="sm" className="justify-start text-xs h-8">
                  Set New Goal
                </Button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default HeroGallery;