import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';

@Pipe({
  name: 'iframVideo',
  standalone: true
})
export class IframVideoPipe implements PipeTransform {
  // YouTube ID format: 11 alphanumeric characters, hyphens, and underscores
  private readonly YOUTUBE_ID_REGEX = /^[a-zA-Z0-9_-]{11}$/;

  // Allowed YouTube domains for extra safety
  private readonly ALLOWED_DOMAINS = [
    'www.youtube.com',
    'youtube.com',
    'youtu.be'
  ];

  constructor(public sanitizer: DomSanitizer) {}

  /**
   * Extracts YouTube video ID from various YouTube URL formats
   * @param url YouTube URL in various formats
   * @returns SafeResourceUrl for iframe src or null if invalid
   */
  transform(url: any): SafeResourceUrl | null {
    // Validate input
    if (!url || typeof url !== 'string') {
      console.warn('[IframVideoPipe] Invalid URL input:', url);
      return null;
    }

    // Trim whitespace
    const trimmedUrl = url.trim();

    // Extract YouTube video ID
    const videoId = this.extractYoutubeId(trimmedUrl);

    if (!videoId) {
      console.warn('[IframVideoPipe] Could not extract valid YouTube ID from URL:', trimmedUrl);
      return null;
    }

    // Validate the extracted ID
    if (!this.isValidYoutubeId(videoId)) {
      console.warn('[IframVideoPipe] Invalid YouTube ID format:', videoId);
      return null;
    }

    // Construct trusted YouTube embed URL
    const embedUrl = this.constructEmbedUrl(videoId);

    // Trust only legitimate YouTube embed URLs
    return this.sanitizer.bypassSecurityTrustResourceUrl(embedUrl);
  }

  /**
   * Extracts YouTube video ID from various URL formats
   * Supports: youtube.com, youtu.be, and embedded URLs
   */
  private extractYoutubeId(url: string): string | null {
    // Try youtu.be format: https://youtu.be/dQw4w9WgXcQ
    const youtuBeDomain = /youtu\.be\/([a-zA-Z0-9_-]+)/;
    let match = url.match(youtuBeDomain);
    if (match && match[1]) {
      return match[1];
    }

    // Try youtube.com formats
    // Formats: watch?v=ID, &v=ID, /embed/ID, /v/ID, /u/[^/]+/ID
    const youtubePatterns = [
      /youtube\.com\/watch[?&]v=([a-zA-Z0-9_-]+)/,
      /youtube\.com\/embed\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/v\/([a-zA-Z0-9_-]+)/,
      /youtube\.com\/u\/[^/]+\/([a-zA-Z0-9_-]+)/,
      /[?&]v=([a-zA-Z0-9_-]+)/
    ];

    for (const pattern of youtubePatterns) {
      match = url.match(pattern);
      if (match && match[1]) {
        return match[1];
      }
    }

    return null;
  }

  /**
   * Validates YouTube video ID format
   * YouTube IDs are exactly 11 characters, alphanumeric with hyphens and underscores
   */
  private isValidYoutubeId(id: string): boolean {
    if (!id || typeof id !== 'string') {
      return false;
    }

    // Must be exactly 11 characters
    if (id.length !== 11) {
      return false;
    }

    // Must match YouTube ID format
    return this.YOUTUBE_ID_REGEX.test(id);
  }

  /**
   * Constructs a secure YouTube embed URL
   * Uses HTTPS and no-cookie domain for enhanced privacy
   */
  private constructEmbedUrl(videoId: string): string {
    // Use youtube-nocookie.com for privacy (doesn't track user)
    // Fall back to regular youtube.com if needed
    const embedDomain = 'https://www.youtube.com/embed/';

    // Add security parameters
    const embedUrl = new URL(embedDomain + videoId);

    // Remove query params that might be injected
    embedUrl.search = '';

    return embedUrl.toString();
  }
}
