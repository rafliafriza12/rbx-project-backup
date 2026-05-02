"use client";

import { useState, useEffect } from "react";
import Image from "next/image";
import Link from "next/link";
import { X } from "lucide-react";

interface PopupBannerProps {
  enabled: boolean;
  imageUrl: string;
  targetUrl: string;
}

export default function PopupBanner({
  enabled,
  imageUrl,
  targetUrl,
}: PopupBannerProps) {
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    // Return early if popup is disabled or no image is provided
    if (!enabled || !imageUrl) return;

    // Check session storage to ensure it only shows once per session
    // Dihapus sementara agar selalu muncul untuk ditest
    // Show immediately when component mounts (which happens after splashscreen)
    setIsOpen(true);
  }, [enabled, imageUrl]);

  const handleClose = () => {
    setIsOpen(false);
  };

  if (!isOpen) return null;

  // The actual image content
  const ImageContent = (
    <div className="relative aspect-[4/5] w-full h-full max-h-[80vh] bg-black/50 rounded-2xl overflow-hidden shadow-2xl border-2 border-primary-100/30">
      <Image
        src={imageUrl}
        alt="Promo Banner"
        fill
        className="object-contain"
        priority
      />
    </div>
  );

  return (
    <div className="fixed inset-0 z-[100] flex items-center justify-center p-4 sm:p-6 bg-black/60 backdrop-blur-sm">
      {/* Container with animation */}
      <div 
        className="relative w-full max-w-sm sm:max-w-md animate-in fade-in zoom-in-95 duration-300"
      >
        {/* Close Button positioned slightly outside the image wrapper */}
        <button
          onClick={handleClose}
          className="absolute -top-3 -right-3 z-10 flex items-center justify-center w-8 h-8 rounded-full bg-white text-black shadow-lg hover:bg-gray-200 transition-colors"
          aria-label="Close popup"
        >
          <X className="w-5 h-5" />
        </button>

        {/* Link Wrapper (if targetUrl exists) */}
        {targetUrl ? (
          <Link href={targetUrl} onClick={handleClose} className="block w-full h-full">
            {ImageContent}
          </Link>
        ) : (
          <div className="block w-full h-full">{ImageContent}</div>
        )}
      </div>
    </div>
  );
}
