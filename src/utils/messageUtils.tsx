import React from 'react';

/**
 * Parses message content and converts URLs to clickable links
 * For exam URLs, shows shortened exam ID instead of full URL
 * @param content - The message content to parse
 * @param isUserMessage - Whether this is a user message (affects link styling)
 */
export function parseMessageWithLinks(content: string, isUserMessage = false): React.ReactNode {
  // Regex to match URLs
  const urlRegex = /(https?:\/\/[^\s]+)/g;
  
  const parts = content.split(urlRegex);
  
  return parts.map((part, index) => {
    if (part.match(urlRegex)) {
      // This is a URL
      const url = part;
      
      // Check if it's an exam URL and extract exam ID
      const examUrlRegex = /https?:\/\/[^/]+\/exam\/([^/]+)/;
      const examMatch = url.match(examUrlRegex);
      
      if (examMatch && examMatch[1]) {
        const examId = examMatch[1];
        // Show shortened exam ID instead of full URL
        return (
          <a
            key={`exam-link-${index}-${examId}`}
            href={url}
            className={`underline font-medium hover:opacity-80 transition-opacity ${
              isUserMessage 
                ? 'text-red-100 hover:text-white' 
                : 'text-blue-600 hover:text-blue-800'
            }`}
            onClick={(e) => {
              e.preventDefault();
              // Navigate using current window
              window.location.href = url;
            }}
          >
            {examId}
          </a>
        );
      }
      
      // For other URLs, show as normal clickable links
      return (
        <a
          key={`url-link-${index}-${url.substring(0, 20)}`}
          href={url}
          target="_blank"
          rel="noopener noreferrer"
          className={`underline hover:opacity-80 transition-opacity ${
            isUserMessage
              ? 'text-red-100 hover:text-white'
              : 'text-blue-600 hover:text-blue-800'
          }`}
        >
          {url}
        </a>
      );
    }
    
    // This is regular text
    return part;
  });
}
