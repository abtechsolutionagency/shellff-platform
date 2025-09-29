
"use client";

import { ImageWithFallback } from "../ui/ImageWithFallback";
import { Button } from "../ui/button";

export function Hero1() {
  return (
    <section className="relative w-full h-[400px] md:h-[500px] lg:h-[600px] overflow-hidden rounded-2xl">
      {/* Gradient Background */}
      <div 
        className="absolute inset-0 bg-gradient-to-br from-[#9B5DE5] via-[#121212] to-[#00F5D4] opacity-90"
        style={{
          backgroundImage: `url('https://images.unsplash.com/photo-1737302998863-6e7252d55a02?crop=entropy&cs=tinysrgb&fit=max&fm=jpg&ixid=M3w3Nzg4Nzd8MHwxfHNlYXJjaHwxfHxhYnN0cmFjdCUyMGdyYWRpZW50JTIwcHVycGxlJTIwdGVhbCUyMGJhY2tncm91bmR8ZW58MXx8fHwxNzU4NzAyODM0fDA&ixlib=rb-4.1.0&q=80&w=1080&utm_source=figma&utm_medium=referral')`,
          backgroundSize: 'cover',
          backgroundPosition: 'center'
        }}
      />
      
      {/* Dark Overlay */}
      <div className="absolute inset-0 bg-[#121212] opacity-60 rounded-2xl" />
      
      {/* Content */}
      <div className="relative z-10 h-full flex items-center justify-center px-4 md:px-8">
        <div className="text-center max-w-4xl mx-auto">
          {/* Main Title */}
          <h1 
            className="text-3xl md:text-5xl lg:text-6xl mb-4 bg-gradient-to-r from-[#9B5DE5] to-[#00F5D4] bg-clip-text text-transparent"
            style={{ 
              fontFamily: 'Poppins, sans-serif', 
              fontWeight: 'bold',
              textShadow: '0 0 20px rgba(155, 93, 229, 0.5)'
            }}
          >
            Welcome to Shellff
          </h1>
          
          {/* Tagline */}
          <p 
            className="text-base md:text-lg lg:text-xl text-white mb-6 opacity-90"
            style={{ fontFamily: 'Inter, sans-serif' }}
          >
            Discover, Stream, and Share Music Like Never Before
          </p>
          
          {/* CTA Buttons */}
          <div className="flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Button
              className="bg-[#9B5DE5] hover:bg-[#8A4DD1] text-white px-6 py-2 text-base rounded-lg shadow-lg transition-all duration-300"
              style={{
                fontFamily: 'Poppins, sans-serif',
                fontWeight: 'bold',
                boxShadow: '0 0 20px rgba(155, 93, 229, 0.4)',
              }}
            >
              Start Listening
            </Button>
            
            <Button
              variant="outline"
              className="border-[#00F5D4] text-[#00F5D4] hover:bg-[#00F5D4] hover:text-[#121212] px-6 py-2 text-base rounded-lg transition-all duration-300"
              style={{
                fontFamily: 'Inter, sans-serif',
                boxShadow: '0 0 15px rgba(0, 245, 212, 0.3)',
              }}
            >
              Explore Features
            </Button>
          </div>
        </div>
      </div>
      
      {/* Decorative Elements */}
      <div className="absolute top-6 left-6 w-12 h-12 border border-[#9B5DE5] rounded-full opacity-20 animate-pulse" />
      <div className="absolute bottom-12 right-12 w-10 h-10 border border-[#00F5D4] rounded-full opacity-30 animate-pulse" />
    </section>
  );
}
