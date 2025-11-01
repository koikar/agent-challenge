/**
 * Multimedia Components for Apps SDK
 * Optimized for images, videos, and embedded content in ChatGPT Apps SDK
 */

import { Download, ExternalLink, Image as ImageIcon, Play } from "lucide-react";
import React, { useState } from "react";
import { cn } from "@/lib/utils";

export interface MultimediaAsset {
  type: "image" | "video" | "audio" | "document" | "embed";
  url: string;
  alt?: string;
  caption?: string;
  width?: number;
  height?: number;
  duration?: number;
  fileSize?: number;
  mimeType?: string;
}

/**
 * Optimized image component with loading states and fallbacks
 */
export function AppsSdkImage({
  asset,
  className,
  maxWidth = 800,
}: {
  asset: MultimediaAsset;
  className?: string;
  maxWidth?: number;
}) {
  const [loaded, setLoaded] = useState(false);
  const [error, setError] = useState(false);

  if (error) {
    return (
      <div
        className={cn(
          "flex items-center justify-center p-8 bg-gray-100 dark:bg-gray-800 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-600",
          className,
        )}
      >
        <div className="text-center">
          <ImageIcon className="h-8 w-8 text-gray-400 mx-auto mb-2" />
          <p className="text-sm text-gray-500 dark:text-gray-400">Image not available</p>
          {asset.url && (
            <a
              href={asset.url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-xs text-blue-600 dark:text-blue-400 hover:underline mt-1 inline-flex items-center gap-1"
            >
              View original <ExternalLink className="h-3 w-3" />
            </a>
          )}
        </div>
      </div>
    );
  }

  return (
    <figure className={cn("mb-6", className)}>
      <div className="relative">
        {!loaded && (
          <div className="absolute inset-0 flex items-center justify-center bg-gray-100 dark:bg-gray-800 rounded-lg animate-pulse">
            <ImageIcon className="h-8 w-8 text-gray-400" />
          </div>
        )}
        <img
          src={asset.url}
          alt={asset.alt || "Content image"}
          onLoad={() => setLoaded(true)}
          onError={() => setError(true)}
          className={cn(
            "rounded-lg shadow-sm border border-gray-200 dark:border-gray-700 w-full h-auto",
            !loaded && "opacity-0",
            "transition-opacity duration-300",
          )}
          style={{ maxWidth: `${maxWidth}px` }}
        />
      </div>
      {asset.caption && (
        <figcaption className="mt-2 text-sm text-gray-600 dark:text-gray-400 italic text-center">
          {asset.caption}
        </figcaption>
      )}
    </figure>
  );
}

/**
 * Video component with thumbnail and play controls
 */
export function AppsSdkVideo({ asset, className }: { asset: MultimediaAsset; className?: string }) {
  const [isPlaying, setIsPlaying] = useState(false);

  // For embedded videos (YouTube, Vimeo, etc.)
  if (asset.type === "embed") {
    return (
      <div className={cn("mb-6", className)}>
        <div className="relative aspect-video rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700">
          <iframe
            src={asset.url}
            title={asset.caption || "Embedded video"}
            className="w-full h-full"
            allowFullScreen
            frameBorder="0"
          />
        </div>
        {asset.caption && (
          <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">
            {asset.caption}
          </p>
        )}
      </div>
    );
  }

  // For direct video files
  return (
    <div className={cn("mb-6", className)}>
      <div className="relative aspect-video rounded-lg overflow-hidden shadow-sm border border-gray-200 dark:border-gray-700 bg-black">
        {!isPlaying ? (
          <div
            className="absolute inset-0 flex items-center justify-center bg-gray-900 cursor-pointer group"
            onClick={() => setIsPlaying(true)}
          >
            <div className="bg-white bg-opacity-90 rounded-full p-4 group-hover:bg-opacity-100 transition-all">
              <Play className="h-8 w-8 text-gray-900 ml-1" />
            </div>
            {asset.duration && (
              <div className="absolute bottom-4 right-4 bg-black bg-opacity-70 text-white text-xs px-2 py-1 rounded">
                {formatDuration(asset.duration)}
              </div>
            )}
          </div>
        ) : (
          <video src={asset.url} controls autoPlay className="w-full h-full object-contain" />
        )}
      </div>
      {asset.caption && (
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400 text-center">{asset.caption}</p>
      )}
    </div>
  );
}

/**
 * Document/file component with download link
 */
export function AppsSdkDocument({
  asset,
  className,
}: {
  asset: MultimediaAsset;
  className?: string;
}) {
  const getFileTypeIcon = (mimeType?: string) => {
    if (!mimeType) return "📄";
    if (mimeType.includes("pdf")) return "📄";
    if (mimeType.includes("doc")) return "📝";
    if (mimeType.includes("sheet") || mimeType.includes("excel")) return "📊";
    if (mimeType.includes("presentation") || mimeType.includes("powerpoint")) return "📽️";
    return "📄";
  };

  const formatFileSize = (bytes?: number) => {
    if (!bytes) return "";
    const sizes = ["B", "KB", "MB", "GB"];
    const i = Math.floor(Math.log(bytes) / Math.log(1024));
    return `${(bytes / 1024 ** i).toFixed(1)} ${sizes[i]}`;
  };

  return (
    <div
      className={cn(
        "mb-4 p-4 border border-gray-200 dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        <div className="text-2xl">{getFileTypeIcon(asset.mimeType)}</div>
        <div className="flex-1">
          <div className="font-medium text-gray-900 dark:text-gray-100">
            {asset.caption || "Document"}
          </div>
          {asset.fileSize && (
            <div className="text-sm text-gray-500 dark:text-gray-400">
              {formatFileSize(asset.fileSize)}
            </div>
          )}
        </div>
        <a
          href={asset.url}
          target="_blank"
          rel="noopener noreferrer"
          className="inline-flex items-center gap-1 px-3 py-1 bg-blue-600 text-white text-sm rounded hover:bg-blue-700 transition-colors"
        >
          <Download className="h-4 w-4" />
          Download
        </a>
      </div>
    </div>
  );
}

/**
 * Gallery component for multiple images
 */
export function AppsSdkGallery({
  assets,
  className,
}: {
  assets: MultimediaAsset[];
  className?: string;
}) {
  const [selectedImage, setSelectedImage] = useState<number | null>(null);

  return (
    <div className={cn("mb-6", className)}>
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        {assets.map((asset, index) => (
          <div
            key={index}
            className="relative aspect-square cursor-pointer group"
            onClick={() => setSelectedImage(index)}
          >
            <img
              src={asset.url}
              alt={asset.alt || `Gallery image ${index + 1}`}
              className="w-full h-full object-cover rounded-lg border border-gray-200 dark:border-gray-700 group-hover:opacity-80 transition-opacity"
            />
          </div>
        ))}
      </div>

      {/* Lightbox/Modal for selected image */}
      {selectedImage !== null && (
        <div
          className="fixed inset-0 z-50 bg-black bg-opacity-90 flex items-center justify-center p-4"
          onClick={() => setSelectedImage(null)}
        >
          <div className="relative max-w-full max-h-full">
            <img
              src={assets[selectedImage].url}
              alt={assets[selectedImage].alt || "Gallery image"}
              className="max-w-full max-h-full object-contain rounded-lg"
            />
            <button
              onClick={() => setSelectedImage(null)}
              className="absolute top-4 right-4 text-white bg-black bg-opacity-50 rounded-full p-2 hover:bg-opacity-70"
            >
              ✕
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

/**
 * Multimedia renderer that chooses the appropriate component
 */
export function AppsSdkMultimedia({
  assets,
  className,
}: {
  assets: MultimediaAsset | MultimediaAsset[];
  className?: string;
}) {
  const assetArray = Array.isArray(assets) ? assets : [assets];

  if (assetArray.length === 0) return null;

  // Multiple images - show as gallery
  const images = assetArray.filter((asset) => asset.type === "image");
  if (images.length > 1) {
    return <AppsSdkGallery assets={images} className={className} />;
  }

  // Render each asset type appropriately
  return (
    <div className={className}>
      {assetArray.map((asset, index) => {
        switch (asset.type) {
          case "image":
            return <AppsSdkImage key={index} asset={asset} />;
          case "video":
          case "embed":
            return <AppsSdkVideo key={index} asset={asset} />;
          case "document":
            return <AppsSdkDocument key={index} asset={asset} />;
          default:
            return null;
        }
      })}
    </div>
  );
}

// Helper functions
function formatDuration(seconds: number): string {
  const minutes = Math.floor(seconds / 60);
  const remainingSeconds = seconds % 60;
  return `${minutes}:${remainingSeconds.toString().padStart(2, "0")}`;
}
