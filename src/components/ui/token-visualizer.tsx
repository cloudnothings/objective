"use client";

import { useMemo } from "react";

interface TokenVisualizerProps {
  text: string;
  className?: string;
}

// Simple tokenization that approximates how modern tokenizers work
export const tokenizeText = (text: string): string[] => {
  if (!text) return [];

  // This is a simplified tokenization that tries to approximate real tokenizer behavior
  const tokens: string[] = [];
  let current = "";

  for (const [i, char] of Array.from(text).entries()) {

    // Handle whitespace
    if (/\s/.test(char)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      // Include the whitespace as part of the next token or as a separate token
      if (char === " ") {
        current += char;
      } else {
        tokens.push(char);
      }
      continue;
    }

    // Handle punctuation - often separate tokens
    if (/[.,;:!?()[\]{}"'`-]/.test(char)) {
      if (current) {
        tokens.push(current);
        current = "";
      }
      tokens.push(char);
      continue;
    }

    // Handle numbers - usually grouped together
    if (/\d/.test(char)) {
      if (current && current.length > 0 && !/\d/.test(current.charAt(current.length - 1))) {
        tokens.push(current);
        current = "";
      }
      current += char;
      continue;
    }

    // Handle letters - group into subwords
    if (/[a-zA-Z]/.test(char)) {
      current += char;

      // Split on common subword boundaries (simplified BPE-like behavior)
      if (current.length >= 3) {
        // Check for common prefixes/suffixes
        if (current.endsWith("ing") || current.endsWith("ed") || current.endsWith("er") ||
          current.endsWith("est") || current.endsWith("ly") || current.endsWith("ion")) {
          // Keep building
        } else if (current.length >= 6) {
          // Split longer words
          tokens.push(current);
          current = "";
        }
      }
      continue;
    }

    // Other characters
    if (current) {
      tokens.push(current);
      current = "";
    }
    tokens.push(char);
  }

  if (current) {
    tokens.push(current);
  }

  return tokens.filter(token => token.length > 0);
};

// Generate a consistent color for each token based on its content
const getTokenColor = (token: string, index: number): string => {
  // Create a hash from the token content and index for consistent colors
  let hash = 0;
  const combined = token + index.toString();
  for (const [i, char] of Array.from(combined).entries()) {
    const charCode = combined.charCodeAt(i);
    hash = ((hash << 5) - hash) + charCode;
    hash = hash & hash; // Convert to 32-bit integer
  }

  // Generate HSL color with good contrast
  const hue = Math.abs(hash) % 360;
  const saturation = 45 + (Math.abs(hash) % 20); // 45-65%
  const lightness = 85 + (Math.abs(hash) % 10); // 85-95% for light background

  return `hsl(${hue}, ${saturation}%, ${lightness}%)`;
};

export function TokenVisualizer({ text, className = "" }: TokenVisualizerProps) {
  const tokens = useMemo(() => tokenizeText(text), [text]);

  if (!text.trim()) {
    return (
      <div className={`min-h-[80px] p-2 text-xs font-mono text-gray-400 ${className}`}>
        Enter text to see token visualization...
      </div>
    );
  }

  return (
    <div className={`p-3 text-xs font-mono leading-relaxed ${className}`}>
      <div className="select-text break-words">
        {tokens.map((token, index) => (
          <span
            key={index}
            className="inline border-r border-gray-300/30 dark:border-gray-600/30 hover:ring-1 hover:ring-blue-300 dark:hover:ring-blue-600 transition-all duration-75"
            style={{
              backgroundColor: getTokenColor(token, index),
              color: '#1f2937' // Dark text for better readability on light backgrounds
            }}
            title={`Token ${index + 1}: "${token}"`}
          >
            {token}
          </span>
        ))}
      </div>
    </div>
  );
} 