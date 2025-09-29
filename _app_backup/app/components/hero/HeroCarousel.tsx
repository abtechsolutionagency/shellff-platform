
"use client";

import { useState, useEffect, useRef } from "react";
import { ChevronLeft, ChevronRight } from "lucide-react";
import { Hero1 } from "./Hero1";
import { Hero2 } from "./Hero2";
import { Hero3 } from "./Hero3";
import { Hero4 } from "./Hero4";
import { Hero5 } from "./Hero5";
import { Button } from "../ui/button";

// Hero sections configuration - this will be configurable by admin in future
const HERO_SECTIONS = [
  { id: "hero1", component: Hero1, title: "Welcome" },
  { id: "hero2", component: Hero2, title: "Featured Album" },
  { id: "hero3", component: Hero3, title: "Creator Spotlight" },
  { id: "hero4", component: Hero4, title: "Live Events" },
  { id: "hero5", component: Hero5, title: "Merchandise" },
];

export function HeroCarousel() {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [isAutoPlaying, setIsAutoPlaying] = useState(true);
  const [touchStart, setTouchStart] = useState(0);
  const [touchEnd, setTouchEnd] = useState(0);
  const carouselRef = useRef<HTMLDivElement>(null);

  // Auto-play functionality
  useEffect(() => {
    if (!isAutoPlaying) return;

    const interval = setInterval(() => {
      setCurrentIndex((prevIndex) => 
        prevIndex === HERO_SECTIONS.length - 1 ? 0 : prevIndex + 1
      );
    }, 8000); // Change slide every 8 seconds

    return () => clearInterval(interval);
  }, [isAutoPlaying]);

  // Pause auto-play when user interacts
  const pauseAutoPlay = () => {
    setIsAutoPlaying(false);
    // Resume auto-play after 10 seconds of inactivity
    setTimeout(() => setIsAutoPlaying(true), 10000);
  };

  const nextSlide = () => {
    pauseAutoPlay();
    setCurrentIndex(currentIndex === HERO_SECTIONS.length - 1 ? 0 : currentIndex + 1);
  };

  const prevSlide = () => {
    pauseAutoPlay();
    setCurrentIndex(currentIndex === 0 ? HERO_SECTIONS.length - 1 : currentIndex - 1);
  };

  const goToSlide = (index: number) => {
    pauseAutoPlay();
    setCurrentIndex(index);
  };

  // Touch handlers for mobile swipe
  const handleTouchStart = (e: React.TouchEvent) => {
    setTouchStart(e.targetTouches[0].clientX);
  };

  const handleTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const handleTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > 50;
    const isRightSwipe = distance < -50;

    if (isLeftSwipe) {
      nextSlide();
    } else if (isRightSwipe) {
      prevSlide();
    }

    // Reset touch values
    setTouchStart(0);
    setTouchEnd(0);
  };

  return (
    <div className="relative w-full mb-8">
      {/* Carousel Container */}
      <div
        ref={carouselRef}
        className="relative overflow-hidden rounded-2xl"
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
        onMouseEnter={() => setIsAutoPlaying(false)}
        onMouseLeave={() => setIsAutoPlaying(true)}
      >
        {/* Hero Slides */}
        <div 
          className="flex transition-transform duration-500 ease-in-out"
          style={{ transform: `translateX(-${currentIndex * 100}%)` }}
        >
          {HERO_SECTIONS.map((section, index) => {
            const Component = section.component;
            return (
              <div key={section.id} className="w-full flex-shrink-0">
                <Component />
              </div>
            );
          })}
        </div>

        {/* Navigation Arrows - Hidden on mobile, visible on desktop */}
        <Button
          variant="ghost"
          size="icon"
          className="absolute left-4 top-1/2 -translate-y-1/2 bg-black/20 backdrop-blur-sm hover:bg-black/40 text-white border-0 hidden md:flex"
          onClick={prevSlide}
        >
          <ChevronLeft className="h-6 w-6" />
        </Button>

        <Button
          variant="ghost"
          size="icon"
          className="absolute right-4 top-1/2 -translate-y-1/2 bg-black/20 backdrop-blur-sm hover:bg-black/40 text-white border-0 hidden md:flex"
          onClick={nextSlide}
        >
          <ChevronRight className="h-6 w-6" />
        </Button>
      </div>

      {/* Dots Indicator */}
      <div className="flex justify-center space-x-2 mt-4">
        {HERO_SECTIONS.map((_, index) => (
          <button
            key={index}
            className={`w-2 h-2 rounded-full transition-all duration-300 ${
              index === currentIndex 
                ? "bg-[#9B5DE5] w-6" 
                : "bg-gray-600 hover:bg-gray-500"
            }`}
            onClick={() => goToSlide(index)}
            aria-label={`Go to slide ${index + 1}`}
          />
        ))}
      </div>

      {/* Progress bar for auto-play (optional visual enhancement) */}
      {isAutoPlaying && (
        <div className="absolute bottom-0 left-0 right-0 h-1 bg-black/20">
          <div 
            className="h-full bg-[#9B5DE5] transition-all duration-100"
            style={{
              animation: 'progress 8s linear infinite',
              animationDelay: '0s'
            }}
          />
        </div>
      )}

      <style jsx>{`
        @keyframes progress {
          from { width: 0%; }
          to { width: 100%; }
        }
      `}</style>
    </div>
  );
}
