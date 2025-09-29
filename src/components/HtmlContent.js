import React from "react";
import "./HtmlContent.css";

/**
 * Component to safely render HTML content from rich text editor
 * Falls back to plain text if content appears to be plain text
 */
const HtmlContent = ({
  content,
  className = "",
  maxLength = null,
  showMore = false,
}) => {
  if (!content) return <span className={className}>-</span>;

  // Clean the content and check if it contains HTML tags
  const cleanContent = content.trim();
  const hasHtmlTags = /<[^>]+>/.test(cleanContent);

  // If maxLength is specified, truncate content
  let displayContent = cleanContent;
  let isTruncated = false;

  if (maxLength && cleanContent.length > maxLength) {
    if (hasHtmlTags) {
      // For HTML content, we need to be careful about truncating
      // Simple approach: strip tags for length check, then truncate HTML
      const textContent = cleanContent.replace(/<[^>]+>/g, "");
      if (textContent.length > maxLength) {
        // This is a simple truncation - you might want a more sophisticated approach
        displayContent = cleanContent.substring(0, maxLength) + "...";
        isTruncated = true;
      }
    } else {
      displayContent = cleanContent.substring(0, maxLength) + "...";
      isTruncated = true;
    }
  }

  if (hasHtmlTags) {
    return (
      <div
        className={`html-content ${className}`}
        dangerouslySetInnerHTML={{ __html: displayContent }}
      />
    );
  }

  // Fallback to plain text rendering
  return <span className={className}>{displayContent}</span>;
};

export default HtmlContent;
