"use client";

import * as React from "react";
import { User } from "lucide-react";

import { cn } from "@/lib/cn";
import type { AvatarProps } from "./Avatar.types";

const sizeMap: Record<NonNullable<AvatarProps["size"]>, string> = {
  xs: "h-5 w-5 text-[9px]",
  sm: "h-6 w-6 text-[10px]",
  md: "h-8 w-8 text-xs",
  lg: "h-10 w-10 text-sm",
  xl: "h-12 w-12 text-base",
};

function initialsFor(name: string): string {
  return name
    .split(/\s+/)
    .filter(Boolean)
    .slice(0, 2)
    .map((part) => part[0]?.toUpperCase() ?? "")
    .join("");
}

/**
 * Circular avatar with image + initials fallback.
 *
 * Renders nothing meaningful while the image is loading — the initials
 * are shown until either the image loads or `onError` fires.
 */
export function Avatar({
  src,
  name,
  size = "md",
  fallback,
  className,
  ...props
}: AvatarProps) {
  const [errored, setErrored] = React.useState(false);
  const showImage = src && !errored;
  const fallbackText = fallback ?? (name ? initialsFor(name) : null);

  return (
    <span
      className={cn(
        "relative inline-flex shrink-0 items-center justify-center overflow-hidden rounded-full border border-border bg-bg-muted font-medium text-text-secondary",
        sizeMap[size],
        className,
      )}
      {...props}
    >
      {showImage ? (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          src={src}
          alt={name ?? ""}
          onError={() => setErrored(true)}
          className="h-full w-full object-cover"
        />
      ) : fallbackText ? (
        <span aria-hidden>{fallbackText}</span>
      ) : (
        <User className="h-1/2 w-1/2 text-text-muted" aria-hidden />
      )}
    </span>
  );
}