/**
 * @file utils.ts
 * @purpose Tailwind CSS class merge utility
 * @usedBy All UI components
 * @deps clsx, tailwind-merge
 * @exports cn
 * @sideEffects None
 */

import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}
