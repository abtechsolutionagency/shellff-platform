
"use client";

import { ImageWithFallback } from "../ui/ImageWithFallback";
import { Button } from "../ui/button";
import { ShoppingBag, Star, Truck } from "lucide-react";

export function Hero5() {
  return (
    <section className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden bg-[#121212] rounded-2xl">
      {/* Background Image */}
      <div className="absolute inset-0">
        <ImageWithFallback
          src="https://images.unsplash.com/photo-1724988055403-7b978216a1b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxzdHlsaXNoJTIwaG9vZGllJTIwbWVyY2hhbmRpc2UlMjBmYXNoaW9ufGVufDF8fHx8MTc1ODcwMjgzNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
          alt="Shellff Merchandise"
          className="w-full h-full object-cover rounded-2xl"
        />
      </div>
      
      {/* Gradient Overlay */}
      <div className="absolute inset-0 bg-gradient-to-r from-[#121212] via-[rgba(18,18,18,0.8)] to-[rgba(18,18,18,0.4)] rounded-2xl" />
      
      {/* Content */}
      <div className="relative z-10 h-full flex items-center px-4 md:px-8 lg:px-12">
        <div className="w-full max-w-6xl mx-auto">
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 items-center">
            
            {/* Text Content */}
            <div className="order-2 lg:order-1">
              {/* Merch Category */}
              <div className="mb-4">
                <span 
                  className="inline-flex items-center text-[#00F5D4] text-sm md:text-base uppercase tracking-wider px-4 py-2 rounded-full border border-[#00F5D4] border-opacity-30 bg-[#00F5D4] bg-opacity-10"
                  style={{ 
                    fontFamily: 'Inter, sans-serif', 
                    fontWeight: '500',
                    boxShadow: '0 0 15px rgba(0, 245, 212, 0.3)',
                  }}
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Official Merchandise
                </span>
              </div>
              
              {/* Main Title */}
              <h1 
                className="text-3xl md:text-4xl lg:text-5xl text-white mb-4"
                style={{ 
                  fontFamily: 'Poppins, sans-serif', 
                  fontWeight: 'bold',
                  textShadow: '0 0 20px rgba(255, 255, 255, 0.1)'
                }}
              >
                Wear the
                <span 
                  className="block bg-gradient-to-r from-[#9B5DE5] to-[#00F5D4] bg-clip-text text-transparent"
                >
                  Beat
                </span>
              </h1>
              
              {/* Subtitle */}
              <p 
                className="text-base md:text-lg text-white mb-6 opacity-80 max-w-lg"
                style={{ fontFamily: 'Inter, sans-serif' }}
              >
                Express your music passion with our exclusive Shellff collection. Premium quality hoodies and accessories.
              </p>
              
              {/* Product Highlights */}
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-6">
                <div className="bg-[#2A2A2A] bg-opacity-50 backdrop-blur-sm rounded-lg p-3 border border-[#9B5DE5] border-opacity-20">
                  <h3 
                    className="text-[#9B5DE5] text-base mb-1"
                    style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 'bold' }}
                  >
                    Neon Hoodies
                  </h3>
                  <p 
                    className="text-white opacity-70 text-xs mb-2"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Glow-in-the-dark designs
                  </p>
                  <div className="flex items-center">
                    <span 
                      className="text-[#00F5D4] text-base"
                      style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 'bold' }}
                    >
                      $69.99
                    </span>
                    <div className="flex items-center ml-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-[#00F5D4] fill-current" />
                      ))}
                      <span className="text-white opacity-60 text-xs ml-1">(4.9)</span>
                    </div>
                  </div>
                </div>
                
                <div className="bg-[#2A2A2A] bg-opacity-50 backdrop-blur-sm rounded-lg p-3 border border-[#00F5D4] border-opacity-20">
                  <h3 
                    className="text-[#00F5D4] text-base mb-1"
                    style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 'bold' }}
                  >
                    Wave Caps
                  </h3>
                  <p 
                    className="text-white opacity-70 text-xs mb-2"
                    style={{ fontFamily: 'Inter, sans-serif' }}
                  >
                    Embroidered logo collection
                  </p>
                  <div className="flex items-center">
                    <span 
                      className="text-[#9B5DE5] text-base"
                      style={{ fontFamily: 'Poppins, sans-serif', fontWeight: 'bold' }}
                    >
                      $29.99
                    </span>
                    <div className="flex items-center ml-2">
                      {Array.from({ length: 5 }).map((_, i) => (
                        <Star key={i} className="w-3 h-3 text-[#9B5DE5] fill-current" />
                      ))}
                      <span className="text-white opacity-60 text-xs ml-1">(4.8)</span>
                    </div>
                  </div>
                </div>
              </div>
              
              {/* Benefits */}
              <div className="flex flex-wrap gap-4 mb-6">
                <div className="flex items-center text-[#00F5D4] text-xs">
                  <Truck className="w-4 h-4 mr-2" />
                  <span style={{ fontFamily: 'Inter, sans-serif' }}>Free Shipping Over $50</span>
                </div>
                <div className="flex items-center text-[#9B5DE5] text-xs">
                  <Star className="w-4 h-4 mr-2" />
                  <span style={{ fontFamily: 'Inter, sans-serif' }}>Limited Edition Designs</span>
                </div>
              </div>
              
              {/* CTA Buttons */}
              <div className="flex flex-col sm:flex-row gap-3">
                <Button
                  className="bg-[#9B5DE5] hover:bg-[#8A4DD1] text-white px-6 py-2 text-base rounded-lg shadow-lg transition-all duration-300"
                  style={{
                    fontFamily: 'Poppins, sans-serif',
                    fontWeight: 'bold',
                    boxShadow: '0 0 20px rgba(155, 93, 229, 0.4)',
                  }}
                >
                  <ShoppingBag className="w-4 h-4 mr-2" />
                  Shop Merch
                </Button>
                
                <Button
                  variant="outline"
                  className="border-[#00F5D4] text-[#00F5D4] hover:bg-[#00F5D4] hover:text-[#121212] px-6 py-2 text-base rounded-lg transition-all duration-300"
                  style={{
                    fontFamily: 'Inter, sans-serif',
                    boxShadow: '0 0 15px rgba(0, 245, 212, 0.3)',
                  }}
                >
                  View Catalog
                </Button>
              </div>
            </div>
            
            {/* Product Showcase */}
            <div className="order-1 lg:order-2 flex justify-center lg:justify-end">
              <div className="relative">
                {/* Main Product Image */}
                <div className="w-48 h-48 md:w-60 md:h-60 lg:w-72 lg:h-72 rounded-2xl overflow-hidden shadow-2xl">
                  <ImageWithFallback
                    src="https://images.unsplash.com/photo-1724988055403-7b978216a1b4?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHxzdHlsaXNoJTIwaG9vZGllJTIwbWVyY2hhbmRpc2UlMjBmYXNoaW9ufGVufDF8fHx8MTc1ODcwMjgzNHww&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral"
                    alt="Shellff Merchandise Collection"
                    className="w-full h-full object-cover"
                  />
                </div>
                
                {/* Floating Elements */}
                <div className="absolute -top-2 -right-2 bg-[#9B5DE5] text-white px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                  NEW
                </div>
                
                <div className="absolute -bottom-2 -left-2 bg-[#00F5D4] text-[#121212] px-2 py-1 rounded-full text-xs font-bold shadow-lg">
                  LIMITED
                </div>
                
                {/* Glow Effect */}
                <div 
                  className="absolute inset-0 rounded-2xl border-2 border-[#9B5DE5] opacity-30 animate-pulse"
                  style={{
                    boxShadow: '0 0 30px rgba(155, 93, 229, 0.3)',
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
