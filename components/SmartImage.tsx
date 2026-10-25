"use client";

// Remote image with a graceful fallback: if the remote source fails to load
// (network hiccup, dead CDN path), we swap to a local placeholder SVG so the
// layout never shows a broken image icon. Everything else is next/image:
// responsive sizes, lazy loading, and Vercel-side AVIF/WebP optimization.
import Image from "next/image";
import { useState } from "react";

type SmartImageProps = {
  src: string;
  alt: string;
  sizes?: string;
  priority?: boolean;
  className?: string;
};

export default function SmartImage({
  src,
  alt,
  sizes = "100vw",
  priority = false,
  className = "",
}: SmartImageProps) {
  const [failed, setFailed] = useState(false);

  if (failed) {
    return (
      <Image
        src="/placeholder.svg"
        alt={alt}
        fill
        sizes={sizes}
        priority={priority}
        className={className}
      />
    );
  }

  return (
    <Image
      src={src}
      alt={alt}
      fill
      sizes={sizes}
      priority={priority}
      onError={() => setFailed(true)}
      className={className}
    />
  );
}
