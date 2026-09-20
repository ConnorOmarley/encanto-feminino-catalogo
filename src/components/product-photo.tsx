import { useState } from "react";
import { ImageOff } from "lucide-react";
import imageManifest from "@/data/product-images.json";

export function ProductPhoto({
  src,
  alt,
  className,
  eager = false,
  sizes = "(max-width: 767px) 100vw, (max-width: 1279px) 50vw, 400px",
}: {
  src: string;
  alt: string;
  className?: string;
  eager?: boolean;
  sizes?: string;
}) {
  return <Photo key={src} src={src} alt={alt} className={className} eager={eager} sizes={sizes} />;
}

function Photo({
  src,
  alt,
  className,
  eager,
  sizes,
}: {
  src: string;
  alt: string;
  className?: string;
  eager: boolean;
  sizes: string;
}) {
  const [failed, setFailed] = useState(false);
  const optimized = (
    imageManifest as Record<string, { src: string; srcSet: string; width: number; height: number }>
  )[src];
  if (failed)
    return (
      <div
        className={`photo-unavailable ${className ?? ""}`}
        role="img"
        aria-label={`Foto indisponível: ${alt}`}
      >
        <ImageOff aria-hidden="true" />
        <span>Foto indisponível no momento</span>
      </div>
    );
  return (
    <img
      src={optimized?.src ?? src}
      srcSet={optimized?.srcSet}
      sizes={optimized ? sizes : undefined}
      width={optimized?.width ?? 1200}
      height={optimized?.height ?? 1500}
      alt={alt}
      className={className}
      loading={eager ? "eager" : "lazy"}
      fetchPriority={eager ? "high" : "auto"}
      decoding="async"
      onError={() => setFailed(true)}
    />
  );
}
