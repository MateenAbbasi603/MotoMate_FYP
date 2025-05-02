import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}


export const formatLabel = (label: string) =>
  label.replace(/([a-z])([A-Z])/g, "$1 $2");