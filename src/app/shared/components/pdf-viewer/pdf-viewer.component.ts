import { Component, OnInit, ViewChild, ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { DomSanitizer, SafeResourceUrl } from '@angular/platform-browser';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { PdfViewerService, PdfViewerConfig } from '../../services/pdf-viewer.service';
import { environment } from '../../../../environments/environment';

/**
 * PDF Viewer Component
 * 
 * Safely displays PDF documents with URL validation and sanitization
 * Supports both remote URLs and blob objects
 */
@Component({
  selector: 'app-pdf-viewer',
  standalone: true,
  imports: [CommonModule, FormsModule, NgxExtendedPdfViewerModule],
  templateUrl: './pdf-viewer.component.html',
  styleUrls: ['./pdf-viewer.component.scss'],
})
export class PdfViewerComponent implements OnInit {
  @ViewChild('pdfViewer') pdfViewer: any;
  @Input() filePath?: string;
  @Input() pdfUrl: string | undefined;
  // Trusted resource URL for safe binding
  safePdfUrl: SafeResourceUrl | null = null;

  config: PdfViewerConfig | null = null;
  isFullscreen = false;
  currentPage = 1;
  totalPages = 0;
  searchText = '';
  searchEnabled = true;
  zoomLevel = 100;
  
  // Error handling
  pdfLoadError: string | null = null;
  isLoading = false;

  // Trusted domains for PDF sources
  private readonly TRUSTED_DOMAINS = [
    'example.com',
    'yourdomain.com',
    'api.yourdomain.com',
    environment.serverEndPoint,
    environment.serverBaseEndPoint
    // Add your trusted domains here

  ];

  constructor(
    private pdfViewerService: PdfViewerService,
    private cdr: ChangeDetectorRef,
    private sanitizer: DomSanitizer
  ) {}

  ngOnInit(): void {
    // If filePath is provided via @Input, open it directly
    if (this.filePath) {
      const fileName = this.extractFileName(this.filePath);
      this.pdfViewerService.openPdf(this.filePath, fileName);
    }

    this.pdfViewerService.pdfConfig$.subscribe(config => {
      this.config = config;
      this.pdfLoadError = null;
      this.isLoading = true;

      if (config.url) {
        // Validate and sanitize remote URL
        this.setPdfUrl(config.url);
      } else if (config.blob) {
        // Create safe blob URL
        try {
          const blobUrl = URL.createObjectURL(config.blob);
          this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(blobUrl);
          this.pdfUrl = blobUrl;
        } catch (error) {
          console.error('Error creating blob URL:', error);
          this.pdfLoadError = 'Failed to load PDF from blob';
          this.safePdfUrl = null;
        }
      } else {
        console.warn('No URL or blob provided in PDF config');
        this.safePdfUrl = null;
      }
    });
  }

  /**
   * Sets the PDF URL with validation and sanitization
   * @param url URL to validate and set
   */
  private setPdfUrl(url: string): void {
    // Validate URL format
    if (!this.isValidPdfUrl(url)) {
      console.error('Invalid PDF URL provided:', url);
      this.pdfLoadError = 'Invalid PDF URL format';
      this.safePdfUrl = null;
      return;
    }

    // Validate URL protocol
    if (!this.isSafeUrlScheme(url)) {
      console.error('Unsafe URL scheme detected:', url);
      this.pdfLoadError = 'URL protocol is not secure (must be HTTPS or blob)';
      this.safePdfUrl = null;
      return;
    }

    // Set the safe URL
    this.pdfUrl = url;
    this.safePdfUrl = this.sanitizer.bypassSecurityTrustResourceUrl(url);
  }

  /**
   * Validates PDF URL format and content
   * Checks for:
   * - Valid URL format
   * - Safe protocol
   * - Appropriate file extension or blob
   */
  private isValidPdfUrl(url: string): boolean {
    if (!url || typeof url !== 'string') {
      return false;
    }

    const trimmedUrl = url.trim();

    // Check for blob URLs (created from File/Blob objects)
    if (trimmedUrl.startsWith('blob:')) {
      return true;
    }

    // Check for data URLs (base64 encoded PDFs)
    if (trimmedUrl.startsWith('data:application/pdf')) {
      return true;
    }

    try {
      // Try to parse as URL
      const urlObj = new URL(trimmedUrl);

      // Check if it's a PDF file or has PDF content type
      const pathname = urlObj.pathname.toLowerCase();
      const isPdfFile = pathname.endsWith('.pdf');

      if (!isPdfFile) {
        console.warn('URL does not appear to be a PDF file:', trimmedUrl);
        // Don't block non-.pdf URLs as servers might serve PDFs without extension
      }

      return true;
    } catch (error) {
      console.error('Invalid URL format:', trimmedUrl, error);
      return false;
    }
  }

  /**
   * Checks if URL uses a safe protocol
   * Allows: https, blob, data (for base64 PDFs)
   * Blocks: http, javascript, data (for HTML), file, etc.
   */
  private isSafeUrlScheme(url: string): boolean {
    try {
      // Handle blob and data URLs
      if (url.startsWith('blob:')) {
        return true;
      }

      if (url.startsWith('data:application/pdf')) {
        return true;
      }

      // Block data URLs for other content types
      if (url.startsWith('data:')) {
        return false;
      }

      // Parse regular URLs
      const urlObj = new URL(url);
      const scheme = urlObj.protocol.replace(':', '').toLowerCase();

      // Only allow HTTPS for remote URLs
      if (scheme !== 'https') {
        console.warn('Non-HTTPS URL detected, only HTTPS allowed for remote PDFs:', scheme);
        return false;
      }

      return true;
    } catch (error) {
      console.error('Error checking URL scheme:', error);
      return false;
    }
  }

  /**
   * Validates if URL is from a trusted domain
   * Optional: can be used to restrict PDF sources to known domains
   */
  private isTrustedDomain(url: string): boolean {
    try {
      if (url.startsWith('blob:') || url.startsWith('data:')) {
        return true; // Local URLs are trusted
      }

      const urlObj = new URL(url);
      const hostname = urlObj.hostname;

      // Check if domain is in trusted list
      return this.TRUSTED_DOMAINS.some(domain => 
        hostname === domain || hostname.endsWith('.' + domain)
      );
    } catch (error) {
      return false;
    }
  }

  /**
   * Extracts file name from file path
   */
  private extractFileName(filePath: string): string {
    if (!filePath) return 'document.pdf';
    const parts = filePath.split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart.includes('.') ? lastPart : `${lastPart}.pdf`;
  }

  /**
   * Closes the PDF viewer
   */
  closePdf(): void {
    this.pdfViewerService.closePdf();
    this.safePdfUrl = null;
    this.pdfLoadError = null;
  }

  /**
   * Toggles fullscreen mode
   */
  toggleFullscreen(): void {
    const container = document.querySelector('.pdf-viewer-container');
    if (!this.isFullscreen) {
      if (container?.requestFullscreen) {
        container.requestFullscreen().catch(err => {
          console.error('Error attempting to enable fullscreen:', err);
        });
      }
      this.isFullscreen = true;
    } else {
      if (document.fullscreenElement) {
        document.exitFullscreen();
      }
      this.isFullscreen = false;
    }
  }

  /**
   * Increases zoom level
   */
  zoomIn(): void {
    this.zoomLevel = Math.min(this.zoomLevel + 10, 400);
  }

  /**
   * Decreases zoom level
   */
  zoomOut(): void {
    this.zoomLevel = Math.max(this.zoomLevel - 10, 50);
  }

  /**
   * Resets zoom to 100%
   */
  resetZoom(): void {
    this.zoomLevel = 100;
  }

  /**
   * Downloads the PDF file
   */
  downloadPdf(): void {
    if (!this.config?.fileName || !this.pdfUrl) {
      console.error('Cannot download: missing file name or URL');
      return;
    }

    try {
      const link = document.createElement('a');
      link.href = this.pdfUrl;
      link.download = this.config.fileName;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
    } catch (error) {
      console.error('Error downloading PDF:', error);
      this.pdfLoadError = 'Failed to download PDF';
    }
  }

  /**
   * Called when PDF is successfully loaded
   */
  onPdfLoaded(): void {
    console.log('PDF loaded successfully');
    this.isLoading = false;
    this.pdfLoadError = null;
  }

  /**
   * Called when PDF loading fails
   */
  onPdfLoadError(error: any): void {
    console.error('Error loading PDF:', error);
    this.isLoading = false;
    this.pdfLoadError = 'Failed to load PDF. Please check the URL and try again.';
  }

  /**
   * Search implementation - highlights are automatic in ngx-extended-pdf-viewer
   */
  onSearch(event: any): void {
    if (event && event.searchText) {
      console.log('Searching for:', event.searchText);
    }
  }
}
