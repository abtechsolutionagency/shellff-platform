
"use client";

import { ImageWithFallback } from "../ui/ImageWithFallback";
import { Button } from "../ui/button";
import { Calendar, MapPin, Ticket } from "lucide-react";

export function Hero4() {
  return (
    <section className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden bg-[#121212] rounded-2xl">
      {/* Background Image */}
      <div className="absolute inset-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1585131201641-2e3a295bf7dd?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxsaXZlJTIwY29uY2VydCUyMHN0YWdlJTIwbGlnaHRzJTIwbmVvbnxlbnwxfHx8fDE3NTg3MDI4MzN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Live Concert"
          className="w-full h-full object-cover rounded-2xl"
        />
      </div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-[rgba(18,18,18,0.6)] to-[rgba(18,18,18,0.3)] rounded-2xl" />
      
      {/* Futuristic Neon Elements */}
      <div className="absolute top-6 left-6 w-24 h-24 bg-[#9B5DE5] rounded-full opacity-10 blur-3xl animate-pulse" />
      <div className="absolute bottom-12 right-12 w-20 h-20 bg-[#00F5D4] rounded-full opacity-20 blur-2xl animate-pulse" />
      <div className="absolute top-1/2 left-1/4 w-12 h-12 bg-[#9B5DE5] rounded-full opacity-15 blur-xl animate-pulse" />
      
      {/* Content */}
      <div className="relative z-10 h-full flex items-center px-4 md:px-8 lg:px-12">
        <div className="w-full max-w-6xl mx-auto">
          <div className="text-center max-w-4xl mx-auto">
            
            {/* Event Category */}
            <div className="mb-4">
              <span 
                className="inline-flex items-center text-[#00F5D4] text-sm md:text-base uppercase tracking-wider px-4 py-2 rounded-full border border-[#00F5D4] border-opacity-30 bg-[#00F5D4] bg-opacity-10"
                style={{ 
                  fontFamily: 'Inter, sans-serif', 
                  fontWeight: '500',
                  boxShadow: '0 0 15px rgba(0, 245, 212, 0.3)',
                }}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Live Events
              </span>
            </div>
            
            {/* Main Title */}
            <h1 
              className="text-3xl md:text-5xl lg:text-6xl text-white mb-4"
              style={{ 
                fontFamily: 'Poppins, sans-serif', 
                fontWeight: 'bold',
                textShadow: '0 0 30px rgba(155, 93, 229, 0.5), 0 0 60px rgba(0, 245, 212, 0.3)'
              }}
            >
              Discover Live
              <span 
                className="block bg-gradient-to-r from-[#9B5DE5] to-[#00F5D4] bg-clip-text text-transparent"
              >
                Events
              </span>
            </h1>
            
            {/* Subtitle */}
            <p 
              className="text-base md:text-lg lg:text-xl text-white mb-6 opacity-80 max-w-2xl mx-auto"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              Experience the future of live music with immersive concerts and virtual reality shows
            </p>
            
            {/* Featured Event Card */}
            <div className="bg-[#2A2A2A] bg-opacity-50 backdrop-blur-sm border border-[#9B5DE5] border-opacity-30 rounded-2xl p-4 mb-6 max-w-2xl mx-auto">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 items-center">
                <div className="text-center md:text-left">
                  <h3 
                    className="text-lg text-[#9B5DE5] mb-1"
                    style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 'bold' }}
                  >
                    Synthwave Festival 2025
                  </h3>
                  <p 
                    className="text-white opacity-70 text-xs"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Electronic Music Extravaganza
                  </p>
                </div>
                
                <div className="flex items-center justify-center md:justify-start text-[#00F5D4]">
                  <MapPin className="w-4 h-4 mr-2" />
                  <span 
                    className="text-xs"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Virtual + LA Convention Center
                  </span>
                </div>
                
                <div className="text-center md:text-right">
                  <div 
                    className="text-white text-xs mb-1"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    March 15-17, 2025
                  </div>
                  <div 
                    className="text-[#00F5D4] text-xs"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Starting from $49
                  </div>
                </div>
              </div>
            </div>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
              <Button
                className="bg-[#9B5DE5] hover:bg-[#8A4DD1] text-white px-6 py-2 text-base rounded-lg shadow-lg transition-all duration-300"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 'bold',
                  boxShadow: '0 0 25px rgba(155, 93, 229, 0.5)',
                }}
              >
                <Ticket className="w-4 h-4 mr-2" />
                Get Tickets
              </Button>
              
              <Button
                variant="outline"
                className="border-[#00F5D4] text-[#00F5D4] hover:bg-[#00F5D4] hover:text-[#121212] px-6 py-2 text-base rounded-lg transition-all duration-300"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 0 15px rgba(0, 245, 212, 0.3)',
                }}
              >
                View All Events
              </Button>
            </div>
          </div>
        </div>
      </div>
      
      {/* Futuristic Grid Lines */}
      <div className="absolute bottom-0 left-0 right-0 h-16 opacity-20">
        <div className="grid grid-cols-8 h-full">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="border-l border-[#00F5D4] border-opacity-30" />
          ))}
        </div>
      </div>
    </section>
  );
}
