
"use client";

import { ImageWithFallback } from "../ui/ImageWithFallback";
import { Button } from "../ui/button";
import { Play } from "lucide-react";

export function Hero2() {
  return (
    <section className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden bg-[#121212] rounded-2xl">
      {/* Background Image */}
      <div className="absolute inset-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1629923759854-156b88c433aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpYyUyMGFsYnVtJTIwY292ZXIlMjB2aW55bCUyMHJlY29yZHxlbnwxfHx8fDE3NTg2ODY1MTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Featured Album"
          className="w-full h-full object-cover rounded-2xl"
        />
      </div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#121212] via-transparent to-[#121212] opacity-80 rounded-2xl" />
      <div className="absolute inset-0 bg-gradient-to-t from-[#121212] via-transparent to-transparent opacity-60 rounded-2xl" />
      
      {/* Content */}
      <div className="relative z-10 h-full flex items-center px-4 md:px-8 lg:px-12">
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center w-full max-w-6xl mx-auto">
          
          {/* Album Art Section */}
          <div className="order-2 lg:order-1 flex justify-center lg:justify-start">
            <div className="relative group">
              <div className="w-48 h-48 md:w-60 md:h-60 lg:w-72 lg:h-72 rounded-2xl overflow-hidden shadow-2xl">
                <ImageWithFallback
                  src="https://images.unsplash.com/photo-1629923759854-156b88c433aa?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxtdXNpYyUyMGFsYnVtJTIwY292ZXIlMjB2aW55bCUyMHJlY29yZHxlbnwxfHx8fDE3NTg2ODY1MTN8MA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                  alt="Featured Album Cover"
                  className="w-full h-full object-cover transition-transform duration-300 group-hover:scale-105"
                />
              </div>
              
              {/* Play Button Overlay */}
              <div className="absolute inset-0 flex items-center justify-center bg-black bg-opacity-40 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                <Button
                  size="lg"
                  className="w-16 h-16 rounded-full bg-[#9B5DE5] hover:bg-[#8A4DD1] text-white shadow-xl"
                  style={{
                    boxShadow: '0 0 30px rgba(155, 93, 229, 0.6)',
                  }}
                >
                  <Play className="w-6 h-6 ml-1" />
                </Button>
              </div>
            </div>
          </div>
          
          {/* Text Content */}
          <div className="order-1 lg:order-2 text-center lg:text-left">
            <div className="mb-3">
              <span 
                className="text-[#00F5D4] text-sm md:text-base uppercase tracking-wider"
                style={{ fontFamily: 'Inter, sans-serif', fontWeight: '500' }}
              >
                Featured Album
              </span>
            </div>
            
            <h1 
              className="text-2xl md:text-4xl lg:text-5xl text-white mb-3"
              style={{ 
                fontFamily: 'Poppins, sans-serif', 
                fontWeight: 'bold',
                textShadow: '0 0 20px rgba(255, 255, 255, 0.1)'
              }}
            >
              Midnight Echoes
            </h1>
            
            <p 
              className="text-white text-base md:text-lg mb-2 opacity-80"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              by Luna Rodriguez
            </p>
            
            <p 
              className="text-white text-sm md:text-base mb-6 max-w-md mx-auto lg:mx-0 opacity-70"
              style={{ fontFamily: 'Inter, sans-serif' }}
            >
              An ethereal journey through electronic soundscapes and ambient melodies.
            </p>
            
            {/* CTA Buttons */}
            <div className="flex flex-col sm:flex-row gap-3 justify-center lg:justify-start">
              <Button
                className="bg-[#9B5DE5] hover:bg-[#8A4DD1] text-white px-5 py-2 rounded-lg shadow-lg transition-all duration-300"
                style={{
                  fontFamily: 'Poppins, sans-serif',
                  fontWeight: 'bold',
                  boxShadow: '0 0 20px rgba(155, 93, 229, 0.4)',
                }}
              >
                <Play className="w-4 h-4 mr-2" />
                Play Album
              </Button>
              
              <Button
                variant="outline"
                className="border-[#00F5D4] text-[#00F5D4] hover:bg-[#00F5D4] hover:text-[#121212] px-5 py-2 rounded-lg transition-all duration-300"
                style={{
                  fontFamily: 'Inter, sans-serif',
                  boxShadow: '0 0 15px rgba(0, 245, 212, 0.3)',
                }}
              >
                Add to Library
              </Button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
