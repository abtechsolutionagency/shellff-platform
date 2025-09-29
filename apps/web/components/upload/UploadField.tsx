
'use client';

import { useRef, useState } from 'react';
import { Upload, X, FileAudio, Image as ImageIcon, File } from 'lucide-react';
import NextImage from 'next/image';
import { Button } from '@/components/ui/button';

interface UploadFieldProps {
  accept?: string;
  onFileSelect: (file: File | null) => void;
  preview?: string;
  label?: string;
  description?: string;
  disabled?: boolean;
  className?: string;
}

export function UploadField({
  accept = "*/*",
  onFileSelect,
  preview,
  label = "Choose file",
  description,
  disabled = false,
  className = ""
}: UploadFieldProps) {
  const fileInputRef = useRef<HTMLInputElement>(null);
  const [dragOver, setDragOver] = useState(false);
  const [selectedFile, setSelectedFile] = useState<File | null>(null);

  const handleFileSelect = (file: File) => {
    setSelectedFile(file);
    onFileSelect(file);
  };

  const handleRemoveFile = () => {
    setSelectedFile(null);
    onFileSelect(null);
    if (fileInputRef.current) {
      fileInputRef.current.value = '';
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    if (!disabled) {
      setDragOver(true);
    }
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setDragOver(false);
    
    if (disabled) return;
    
    const files = Array.from(e.dataTransfer.files);
    if (files.length > 0) {
      const file = files[0];
      // Validate file type
      if (accept !== "*/*" && !file.type.match(accept.replace('*', '.*'))) {
        return;
      }
      handleFileSelect(file);
    }
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(e.target.files || []);
    if (files.length > 0) {
      handleFileSelect(files[0]);
    }
  };

  const getFileIcon = (file: File) => {
    if (file.type.startsWith('audio/')) {
      return <FileAudio className="w-6 h-6 text-purple-400" />;
    } else if (file.type.startsWith('image/')) {
      return <ImageIcon className="w-6 h-6 text-green-400" />;
    }
    return <File className="w-6 h-6 text-gray-400" />;
  };

  const formatFileSize = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  };

  return (
    <div className={`space-y-4 ${className}`}>
      <input
        ref={fileInputRef}
        type="file"
        accept={accept}
        onChange={handleInputChange}
        className="hidden"
        disabled={disabled}
      />

      {selectedFile && preview ? (
        // Preview for images
        <div className="relative">
          <div className="relative w-full h-48 bg-gray-900/50 rounded-lg overflow-hidden border border-gray-600">
            <NextImage
              src={preview}
              alt="Selected file preview"
              fill
              sizes="(max-width: 768px) 100vw, 50vw"
              className="object-cover"
              unoptimized
            />
            <Button
              variant="destructive"
              size="sm"
              className="absolute top-2 right-2"
              onClick={handleRemoveFile}
            >
              <X className="w-4 h-4" />
            </Button>
          </div>
        </div>
      ) : selectedFile ? (
        // File info display for non-images
        <div className="flex items-center justify-between p-4 bg-gray-900/50 rounded-lg border border-gray-600">
          <div className="flex items-center gap-3">
            {getFileIcon(selectedFile)}
            <div>
              <p className="text-white font-medium">{selectedFile.name}</p>
              <p className="text-gray-400 text-sm">{formatFileSize(selectedFile.size)}</p>
            </div>
          </div>
          <Button
            variant="ghost"
            size="sm"
            onClick={handleRemoveFile}
            className="text-gray-400 hover:text-white"
          >
            <X className="w-4 h-4" />
          </Button>
        </div>
      ) : (
        // Upload area
        <div
          className={`
            relative border-2 border-dashed rounded-lg p-6 text-center transition-colors cursor-pointer
            ${dragOver 
              ? 'border-purple-400 bg-purple-500/10' 
              : 'border-gray-600 hover:border-gray-500'
            }
            ${disabled ? 'opacity-50 cursor-not-allowed' : ''}
          `}
          onDragOver={handleDragOver}
          onDragLeave={handleDragLeave}
          onDrop={handleDrop}
          onClick={() => !disabled && fileInputRef.current?.click()}
        >
          <div className="space-y-4">
            <Upload className={`w-8 h-8 mx-auto ${dragOver ? 'text-purple-400' : 'text-gray-400'}`} />
            <div>
              <p className="text-white font-medium">{label}</p>
              {description && (
                <p className="text-gray-400 text-sm mt-1">{description}</p>
              )}
              <p className="text-gray-500 text-xs mt-2">
                Drag and drop or click to browse
              </p>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}




