

"use client";

import { CreatorUpload } from './CreatorUpload';

export function CreatorUploadContent() {
  return (
    <div className="min-h-screen bg-[#121212] pb-20 md:pb-8">
      <main className="md:ml-60 p-6">
        {/* Header */}
        <div className="text-center mb-12">
          <h1 className="text-4xl lg:text-5xl font-bold font-poppins bg-gradient-to-r from-purple-400 via-pink-400 to-purple-400 bg-clip-text text-transparent mb-4">
            Upload Your Music
          </h1>
          <p className="text-xl text-gray-300 font-inter max-w-2xl mx-auto">
            Share your creativity with the world. Upload singles, albums, or EPs with full royalty control.
          </p>
        </div>

        <CreatorUpload />
      </main>
    </div>
  );
}

