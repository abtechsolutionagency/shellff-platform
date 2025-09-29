"use client";

import { useState } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  FileText,
  FileImage,
  Archive,
  CheckCircle,
  Clock,
  AlertCircle,
  RefreshCcw
} from "lucide-react";
import { toast } from "react-hot-toast";

interface CodeBundle {
  id: string;
  batchId: string;
  releaseId: string;
  albumTitle: string;
  artistName: string;
  totalCodes: number;
  generatedAt: string;
  status: 'generating' | 'ready' | 'error';
  downloadUrls?: {
    csv: string;
    pdf: string;
    zip: string;
  };
}

interface CodeBundleDownloadProps {
  bundle: CodeBundle;
  onRefresh?: () => void;
}

export function CodeBundleDownload({ bundle, onRefresh }: CodeBundleDownloadProps) {
  const [downloading, setDownloading] = useState<string | null>(null);

  const handleDownload = async (format: 'csv' | 'pdf' | 'zip') => {
    if (bundle.status !== 'ready' || !bundle.downloadUrls) {
      toast.error('Bundle is not ready for download');
      return;
    }

    setDownloading(format);
    
    try {
      const url = bundle.downloadUrls[format];
      
      // Create download link
      const link = document.createElement('a');
      link.href = url;
      link.download = `${bundle.albumTitle}-codes-${bundle.batchId}.${format === 'zip' ? 'zip' : format}`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      
      toast.success(`${format.toUpperCase()} file downloaded successfully`);
    } catch (error) {
      console.error(`Error downloading ${format}:`, error);
      toast.error(`Failed to download ${format.toUpperCase()} file`);
    } finally {
      setDownloading(null);
    }
  };

  const getStatusIcon = () => {
    switch (bundle.status) {
      case 'generating':
        return <Clock className="h-5 w-5 text-yellow-400 animate-spin" />;
      case 'ready':
        return <CheckCircle className="h-5 w-5 text-green-400" />;
      case 'error':
        return <AlertCircle className="h-5 w-5 text-red-400" />;
    }
  };

  const getStatusText = () => {
    switch (bundle.status) {
      case 'generating':
        return 'Generating codes and barcodes...';
      case 'ready':
        return 'Ready for download';
      case 'error':
        return 'Generation failed';
    }
  };

  const getStatusBadge = () => {
    switch (bundle.status) {
      case 'generating':
        return <Badge variant="secondary" className="bg-yellow-500/20 text-yellow-400">Generating</Badge>;
      case 'ready':
        return <Badge variant="secondary" className="bg-green-500/20 text-green-400">Ready</Badge>;
      case 'error':
        return <Badge variant="secondary" className="bg-red-500/20 text-red-400">Error</Badge>;
    }
  };

  return (
    <Card className="bg-gray-900/50 border-gray-800">
      <CardContent className="p-6">
        <div className="flex items-start justify-between mb-4">
          <div>
            <h3 className="text-lg font-semibold text-white mb-1">
              {bundle.albumTitle}
            </h3>
            <p className="text-gray-400 text-sm mb-2">
              by {bundle.artistName}
            </p>
            <p className="text-gray-500 text-xs">
              {bundle.totalCodes} codes • Generated {new Date(bundle.generatedAt).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center gap-2">
            {getStatusBadge()}
            {bundle.status === 'error' && onRefresh && (
              <Button
                variant="ghost"
                size="sm"
                onClick={onRefresh}
                className="text-gray-400 hover:text-white"
              >
                <RefreshCcw className="h-4 w-4" />
              </Button>
            )}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-6">
          {getStatusIcon()}
          <span className="text-sm text-gray-400">{getStatusText()}</span>
        </div>

        {bundle.status === 'ready' && bundle.downloadUrls && (
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <Button
              variant="outline"
              className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
              onClick={() => handleDownload('csv')}
              disabled={downloading === 'csv'}
            >
              {downloading === 'csv' ? (
                <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileText className="h-4 w-4 mr-2" />
              )}
              CSV Data
            </Button>

            <Button
              variant="outline"
              className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
              onClick={() => handleDownload('pdf')}
              disabled={downloading === 'pdf'}
            >
              {downloading === 'pdf' ? (
                <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <FileImage className="h-4 w-4 mr-2" />
              )}
              PDF Printable
            </Button>

            <Button
              variant="outline"
              className="border-purple-500 text-purple-400 hover:bg-purple-500/10"
              onClick={() => handleDownload('zip')}
              disabled={downloading === 'zip'}
            >
              {downloading === 'zip' ? (
                <RefreshCcw className="h-4 w-4 mr-2 animate-spin" />
              ) : (
                <Archive className="h-4 w-4 mr-2" />
              )}
              ZIP Bundle
            </Button>
          </div>
        )}

        {bundle.status === 'generating' && (
          <div className="bg-yellow-500/10 border border-yellow-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <Clock className="h-4 w-4 text-yellow-400" />
              <p className="text-sm text-yellow-400">
                Code generation in progress. This may take a few minutes for large batches.
              </p>
            </div>
          </div>
        )}

        {bundle.status === 'error' && (
          <div className="bg-red-500/10 border border-red-500/20 rounded-lg p-4">
            <div className="flex items-center gap-2">
              <AlertCircle className="h-4 w-4 text-red-400" />
              <p className="text-sm text-red-400">
                Failed to generate codes. Please try again or contact support.
              </p>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
}










