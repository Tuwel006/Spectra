import type { HTMLAttributes, ReactNode } from "react";

export interface CardProps extends HTMLAttributes<HTMLDivElement> {
  /** Remove the default border. */
  readonly bordered?: boolean;
  /** Padding size token. Defaults to `"md"`. */
  readonly padding?: "none" | "sm" | "md" | "lg";
}

export interface CardHeaderProps extends HTMLAttributes<HTMLDivElement> {
  readonly children?: ReactNode;
}

export interface CardBodyProps extends HTMLAttributes<HTMLDivElement> {
  readonly children?: ReactNode;
}

export interface CardFooterProps extends HTMLAttributes<HTMLDivElement> {
  readonly children?: ReactNode;
}

export interface CardTitleProps extends HTMLAttributes<HTMLHeadingElement> {
  readonly children?: ReactNode;
}

export interface CardDescriptionProps extends HTMLAttributes<HTMLParagraphElement> {
  readonly children?: ReactNode;
}