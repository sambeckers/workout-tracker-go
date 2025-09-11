import { useState } from "react";
import { Camera, Settings } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import heroImage from "@/assets/hero-fitness.jpg";

const CoverArea = () => {
  const [coverImage, setCoverImage] = useState(heroImage);

  return (
    <div className="relative">
      {/* Cover Image */}
      <div 
        className="h-48 bg-cover bg-center relative group"
        style={{ backgroundImage: `linear-gradient(rgba(0,0,0,0.2), rgba(0,0,0,0.2)), url(${coverImage})` }}
      >
        {/* Cover Image Controls */}
        <div className="absolute top-4 right-4 opacity-0 group-hover:opacity-100 transition-opacity">
          <Button variant="secondary" size="sm" className="gap-2 bg-white/90 text-gray-700 hover:bg-white">
            <Camera className="h-4 w-4" />
            Change cover
          </Button>
        </div>

        {/* Avatar and Title - Positioned at bottom */}
        <div className="absolute bottom-4 left-8 flex items-end gap-4">
          <div className="relative">
            <Avatar className="h-16 w-16 border-4 border-white shadow-lg">
              <AvatarImage src="" />
              <AvatarFallback className="bg-primary text-primary-foreground text-lg font-semibold">
                SB
              </AvatarFallback>
            </Avatar>
            <Button 
              variant="ghost" 
              size="icon" 
              className="absolute -bottom-1 -right-1 h-6 w-6 bg-white hover:bg-gray-50 border border-gray-200 rounded-full"
            >
              <Camera className="h-3 w-3 text-gray-600" />
            </Button>
          </div>
          
          <div className="pb-2">
            <h1 className="text-2xl font-bold text-white drop-shadow-md">
              Sam's Fitness Tracker
            </h1>
            <p className="text-white/90 text-sm drop-shadow-sm">
              Track your fitness journey and achieve your goals
            </p>
          </div>
        </div>
      </div>

      {/* Subtle divider */}
      <div className="h-px bg-gradient-to-r from-transparent via-border to-transparent" />
    </div>
  );
};

export default CoverArea;