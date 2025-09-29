
"use client";

import { ImageWithFallback } from "../ui/ImageWithFallback";
import { Button } from "../ui/button";
import { ExternalLink, Music } from "lucide-react";

export function Hero3() {
  return (
    <section className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden bg-[#121212] rounded-2xl">
      {/* Background Image */}
      <div className="absolute inset-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1730148138071-b78d694e415d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpY2lhbiUyMGFydGlzdCUyMHBvcnRyYWl0JTIwY29uY2VydHxlbnwxfHx8fDE3NTg3MDI4MzN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Featured Artist"
          className="w-full h-full object-cover rounded-2xl"
        />
      </div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#121212] via-[rgba(18,18,18,0.7)] to-transparent rounded-2xl" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-80 rounded-2xl" />
      
      {/* Neon Glow Effects */}
      <div className="absolute top-12 left-12 w-20 h-20 bg-[#9B5DE5] rounded-full opacity-20 blur-2xl animate-pulse" />
      <div className="absolute bottom-12 right-12 w-16 h-16 bg-[#00F5D4] rounded-full opacity-30 blur-xl animate-pulse" />
      
      {/* Content */}
      <div className="relative z-10 h-full flex items-center px-4 md:px-8 lg:px-12">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            
            {/* Text Content */}
            <div className="order-2 lg:order-1">
              <div className="mb-4">
                <span 
                  className="inline-flex items-center text-[#00F5D4] text-sm md:text-base uppercase tracking-wider mb-2"
                  style={{ fontFamily: 'Inter, sans-serif', fontWeight: '500' }}
                >
                  <Music className="w-4 h-4 mr-2" />
                  Creator Spotlight
                </span>
              </div>
              
              <h1 
                className="text-3xl md:text-4xl lg:text-5xl text-white mb-3"
                style={{ 
                  fontFamily: 'Poppins, sans-serif', 
                  fontWeight: 'bold',
                  textShadow: '0 0 20px rgba(255, 255, 255, 0.1)'
                }}
              >
                Alex Morgan
              </h1>
              
              <p 
                className="text-base md:text-lg mb-2 text-white opacity-80"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Electronic Music Producer
              </p>
              
              <p 
                className="text-sm md:text-base mb-6 max-w-lg text-white opacity-70 leading-relaxed"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Known for groundbreaking synthwave compositions and immersive sonic experiences.
              </p>
              
              {/* Stats */}
              <div className="flex flex-wrap gap-6 mb-6">
                <div className="text-center">
                  <div 
                    className="text-xl md:text-2xl text-[#9B5DE5] mb-1"
                    style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 'bold' }}
                  >
                    2.3M
                  </div>
                  <div 
                    className="text-xs text-white opacity-70"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Monthly Listeners
                  </div>
                </div>
                <div className="text-center">
                  <div 
                    className="text-xl md:text-2xl text-[#00F5D4] mb-1"
                    style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 'bold' }}
                  >
                    48
                  </div>
                  <div 
                    className="text-xs text-white opacity-70"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Tracks Released
                  </div>
                </div>
                <div className="text-center">
                  <div 
                    className="text-xl md:text-2xl text-[#9B5DE5] mb-1"
                    style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 'bold' }}
                  >
                    127
                  </div>
                  <div 
                    className="text-xs text-white opacity-70"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Collaborations
                  </div>
                </div>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="bg-[#9B5DE5] hover:bg-[#8A4DD1] text-white px-5 py-2 rounded-lg shadow-lg transition-all duration-300"
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 'bold',
                    boxShadow: '0 0 20px rgba(155, 93, 229, 0.4)',
                  }}
                >
                  <ExternalLink className="w-4 h-4 mr-2" />
                  Explore Artist
                </Button>
                
                <Button
                  variant="outline"
                  className="border-[#00F5D4] text-[#00F5D4] hover:bg-[#00F5D4] hover:text-[#121212] px-5 py-2 rounded-lg transition-all duration-300"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    boxShadow: '0 0 15px rgba(0, 245, 212, 0.3)',
                  }}
                >
                  Follow Artist
                </Button>
              </div>
            </div>
            
            {/* Artist Portrait */}
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
              <div className="relative">
                <div className="w-48 h-48 md:w-60 md:h-60 lg:w-72 lg:h-72 rounded-full overflow-hidden shadow-2xl border-4 border-[#9B5DE5] border-opacity-30">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1730148138071-b78d694e415d?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpY2lhbiUyMGFydGlzdCUyMHBvcnRyYWl0JTIwY29uY2VydHxlbnwxfHx8fDE3NTg3MDI4MzN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="Alex Morgan"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Neon Ring Effect */}
                <div 
                  className="absolute inset-0 rounded-full border-2 border-[#00F5D4] opacity-50 animate-ping"
                  style={{
                    boxShadow: '0 0 30px rgba(0, 245, 212, 0.5)',
                  }}
                />
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
