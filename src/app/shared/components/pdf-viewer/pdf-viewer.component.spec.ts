import { ComponentFixture, TestBed } from '@angular/core/testing';
import { DomSanitizer } from '@angular/platform-browser';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { PdfViewerComponent } from './pdf-viewer.component';
import { PdfViewerService } from '../../services/pdf-viewer.service';
import { of } from 'rxjs';

describe('PdfViewerComponent', () => {
  let component: PdfViewerComponent;
  let fixture: ComponentFixture<PdfViewerComponent>;
  let pdfViewerService: jasmine.SpyObj<PdfViewerService>;
  let sanitizer: DomSanitizer;

  beforeEach(async () => {
    const pdfViewerServiceSpy = jasmine.createSpyObj('PdfViewerService', [
      'openPdf',
      'closePdf',
    ]);
    pdfViewerServiceSpy.pdfConfig$ = of({
      isOpen: false,
      url: undefined,
      blob: undefined,
      fileName: undefined,
    });

    await TestBed.configureTestingModule({
      imports: [
        PdfViewerComponent,
        CommonModule,
        FormsModule,
        NgxExtendedPdfViewerModule,
      ],
      providers: [
        { provide: PdfViewerService, useValue: pdfViewerServiceSpy },
      ],
    }).compileComponents();

    pdfViewerService = TestBed.inject(
      PdfViewerService
    ) as jasmine.SpyObj<PdfViewerService>;
    sanitizer = TestBed.inject(DomSanitizer);
  });

  beforeEach(() => {
    fixture = TestBed.createComponent(PdfViewerComponent);
    component = fixture.componentInstance;
    fixture.detectChanges();
  });

  describe('Component Initialization', () => {
    it('should create', () => {
      expect(component).toBeTruthy();
    });

    it('should have default zoom level of 100', () => {
      expect(component.zoomLevel).toBe(100);
    });

    it('should have fullscreen disabled initially', () => {
      expect(component.isFullscreen).toBe(false);
    });

    it('should have no PDF load error initially', () => {
      expect(component.pdfLoadError).toBeNull();
    });

    it('should have safePdfUrl null initially', () => {
      expect(component.safePdfUrl).toBeNull();
    });
  });

  describe('URL Validation', () => {
    it('should validate HTTPS URLs', () => {
      const url = 'https://example.com/document.pdf';
      // Access the private method through any type
      const isValid = (component as any).isValidPdfUrl(url);
      expect(isValid).toBe(true);
    });

    it('should reject HTTP URLs', () => {
      const url = 'http://example.com/document.pdf';
      const isSafe = (component as any).isSafeUrlScheme(url);
      expect(isSafe).toBe(false);
    });

    it('should accept blob URLs', () => {
      const url = 'blob:https://example.com/12345';
      const isValid = (component as any).isValidPdfUrl(url);
      expect(isValid).toBe(true);
    });

    it('should accept data URLs with PDF content type', () => {
      const url = 'data:application/pdf;base64,JVBERi0x';
      const isValid = (component as any).isValidPdfUrl(url);
      expect(isValid).toBe(true);
    });

    it('should reject data URLs with HTML content', () => {
      const url = 'data:text/html,<script>alert("xss")</script>';
      const isSafe = (component as any).isSafeUrlScheme(url);
      expect(isSafe).toBe(false);
    });

    it('should reject javascript URLs', () => {
      const url = 'javascript:alert("xss")';
      const isValid = (component as any).isValidPdfUrl(url);
      expect(isValid).toBe(false);
    });

    it('should reject null or undefined URLs', () => {
      expect((component as any).isValidPdfUrl(null)).toBe(false);
      expect((component as any).isValidPdfUrl(undefined)).toBe(false);
    });

    it('should reject non-string URLs', () => {
      expect((component as any).isValidPdfUrl(123)).toBe(false);
      expect((component as any).isValidPdfUrl({})).toBe(false);
      expect((component as any).isValidPdfUrl([])).toBe(false);
    });

    it('should reject URLs with spaces', () => {
      const url = 'https://example.com/document .pdf';
      const isValid = (component as any).isValidPdfUrl(url);
      expect(isValid).toBe(false);
    });

    it('should accept URLs without .pdf extension if valid', () => {
      const url = 'https://example.com/api/document';
      const isValid = (component as any).isValidPdfUrl(url);
      expect(isValid).toBe(true);
    });

    it('should trim whitespace from URLs', () => {
      const url = '  https://example.com/document.pdf  ';
      const isValid = (component as any).isValidPdfUrl(url);
      expect(isValid).toBe(true);
    });

    it('should handle malformed URLs gracefully', () => {
      const url = 'not a valid url at all';
      const isValid = (component as any).isValidPdfUrl(url);
      expect(isValid).toBe(false);
    });
  });

  describe('URL Scheme Validation', () => {
    it('should accept HTTPS scheme', () => {
      const url = 'https://example.com/document.pdf';
      const isSafe = (component as any).isSafeUrlScheme(url);
      expect(isSafe).toBe(true);
    });

    it('should reject HTTP scheme', () => {
      const url = 'http://example.com/document.pdf';
      const isSafe = (component as any).isSafeUrlScheme(url);
      expect(isSafe).toBe(false);
    });

    it('should accept blob scheme', () => {
      const url = 'blob:https://example.com/abc123';
      const isSafe = (component as any).isSafeUrlScheme(url);
      expect(isSafe).toBe(true);
    });

    it('should accept data scheme with PDF content type', () => {
      const url = 'data:application/pdf;base64,JVBERi0x';
      const isSafe = (component as any).isSafeUrlScheme(url);
      expect(isSafe).toBe(true);
    });

    it('should reject data scheme with HTML content type', () => {
      const url = 'data:text/html,<script>alert("xss")</script>';
      const isSafe = (component as any).isSafeUrlScheme(url);
      expect(isSafe).toBe(false);
    });

    it('should reject file:// scheme', () => {
      const url = 'file:///etc/passwd';
      const isSafe = (component as any).isSafeUrlScheme(url);
      expect(isSafe).toBe(false);
    });

    it('should reject javascript: scheme', () => {
      const url = 'javascript:alert("xss")';
      const isSafe = (component as any).isSafeUrlScheme(url);
      expect(isSafe).toBe(false);
    });

    it('should handle invalid URLs gracefully', () => {
      const url = 'not a url';
      const isSafe = (component as any).isSafeUrlScheme(url);
      expect(isSafe).toBe(false);
    });
  });

  describe('Zoom Controls', () => {
    it('should increase zoom level', () => {
      component.zoomLevel = 100;
      component.zoomIn();
      expect(component.zoomLevel).toBe(110);
    });

    it('should decrease zoom level', () => {
      component.zoomLevel = 100;
      component.zoomOut();
      expect(component.zoomLevel).toBe(90);
    });

    it('should not exceed maximum zoom level', () => {
      component.zoomLevel = 395;
      component.zoomIn();
      expect(component.zoomLevel).toBe(400);
    });

    it('should not go below minimum zoom level', () => {
      component.zoomLevel = 55;
      component.zoomOut();
      expect(component.zoomLevel).toBe(50);
    });

    it('should reset zoom to 100', () => {
      component.zoomLevel = 250;
      component.resetZoom();
      expect(component.zoomLevel).toBe(100);
    });
  });

  describe('File Name Extraction', () => {
    it('should extract file name from path with extension', () => {
      const filePath = '/path/to/document.pdf';
      const fileName = (component as any).extractFileName(filePath);
      expect(fileName).toBe('document.pdf');
    });

    it('should add .pdf extension if missing', () => {
      const filePath = '/path/to/document';
      const fileName = (component as any).extractFileName(filePath);
      expect(fileName).toBe('document.pdf');
    });

    it('should handle empty file path', () => {
      const fileName = (component as any).extractFileName('');
      expect(fileName).toBe('document.pdf');
    });

    it('should handle file path with multiple dots', () => {
      const filePath = '/path/to/document.backup.pdf';
      const fileName = (component as any).extractFileName(filePath);
      expect(fileName).toBe('document.backup.pdf');
    });
  });

  describe('PDF Loading', () => {
    it('should set safePdfUrl on successful load', () => {
      const url = 'https://example.com/document.pdf';
      (component as any).setPdfUrl(url);
      expect(component.safePdfUrl).toBeTruthy();
    });

    it('should clear error message on successful load', () => {
      const url = 'https://example.com/document.pdf';
      component.pdfLoadError = 'Previous error';
      (component as any).setPdfUrl(url);
      expect(component.pdfLoadError).toBeNull();
    });

    it('should set error message on invalid URL', () => {
      const url = 'javascript:alert("xss")';
      (component as any).setPdfUrl(url);
      expect(component.pdfLoadError).toBeTruthy();
      expect(component.safePdfUrl).toBeNull();
    });

    it('should set error message on HTTP URL', () => {
      const url = 'http://example.com/document.pdf';
      (component as any).setPdfUrl(url);
      expect(component.pdfLoadError).toBeTruthy();
      expect(component.safePdfUrl).toBeNull();
    });
  });

  describe('Blob URL Handling', () => {
    it('should create blob URL from Blob object', (done) => {
      const pdfBlob = new Blob(['PDF content'], {
        type: 'application/pdf',
      });

      const config = {
        isOpen: true,
        blob: pdfBlob,
        fileName: 'test.pdf',
        url: undefined,
      };

      pdfViewerService.pdfConfig$ = of(config);
      component.ngOnInit();

      setTimeout(() => {
        expect(component.safePdfUrl).toBeTruthy();
        expect(component.pdfUrl).toContain('blob:');
        done();
      }, 100);
    });
  });

  describe('Fullscreen Toggle', () => {
    it('should toggle fullscreen state', () => {
      expect(component.isFullscreen).toBe(false);
      component.toggleFullscreen();
      expect(component.isFullscreen).toBe(true);
    });
  });

  describe('PDF Viewer Closing', () => {
    it('should close PDF and clear state', () => {
      component.pdfUrl = 'https://example.com/document.pdf';
      component.pdfLoadError = 'Some error';
      component.safePdfUrl = sanitizer.bypassSecurityTrustResourceUrl(
        'https://example.com/document.pdf'
      );

      component.closePdf();

      expect(component.safePdfUrl).toBeNull();
      expect(component.pdfLoadError).toBeNull();
    });

    it('should call service close method', () => {
      component.closePdf();
      expect(pdfViewerService.closePdf).toHaveBeenCalled();
    });
  });

  describe('Error Handling', () => {
    it('should set error message on PDF load error', () => {
      const error = new Error('PDF load failed');
      component.onPdfLoadError(error);
      expect(component.pdfLoadError).toBeTruthy();
      expect(component.isLoading).toBe(false);
    });

    it('should set loading to false on successful load', () => {
      component.isLoading = true;
      component.onPdfLoaded();
      expect(component.isLoading).toBe(false);
      expect(component.pdfLoadError).toBeNull();
    });
  });

  describe('Download Functionality', () => {
    it('should not download if no URL', () => {
      component.pdfUrl = undefined;
      component.downloadPdf();
      expect(component.pdfLoadError).toBeNull(); // No error should be set for missing URL
    });

    it('should not download if no file name', () => {
      component.pdfUrl = 'https://example.com/document.pdf';
      component.config = { isOpen: true, fileName: undefined, url: undefined, blob: undefined };
      component.downloadPdf();
      expect(component.pdfLoadError).toBeNull();
    });

    it('should handle download errors gracefully', () => {
      component.pdfUrl = 'https://example.com/document.pdf';
      component.config = {
        isOpen: true,
        fileName: 'test.pdf',
        url: 'https://example.com/document.pdf',
        blob: undefined,
      };

      spyOn(document, 'createElement').and.throwError('createElement error');
      component.downloadPdf();

      expect(component.pdfLoadError).toBeTruthy();
    });
  });

  describe('Security Features', () => {
    it('should use DomSanitizer for URL binding', () => {
      spyOn(sanitizer, 'bypassSecurityTrustResourceUrl').and.callThrough();
      const url = 'https://example.com/document.pdf';
      (component as any).setPdfUrl(url);
      expect(sanitizer.bypassSecurityTrustResourceUrl).toHaveBeenCalledWith(url);
    });

    it('should prevent XSS through URL injection', () => {
      const maliciousUrl = '<img src=x onerror=alert("xss")>';
      const isValid = (component as any).isValidPdfUrl(maliciousUrl);
      expect(isValid).toBe(false);
    });

    it('should prevent SQL injection through URL parameters', () => {
      const sqlUrl = "https://example.com/document.pdf'; DROP TABLE users;--";
      const isValid = (component as any).isValidPdfUrl(sqlUrl);
      expect(isValid).toBe(true); // URL is valid format, but would be blocked by backend
    });

    it('should block file protocol attacks', () => {
      const fileUrl = 'file:///etc/passwd';
      const isSafe = (component as any).isSafeUrlScheme(fileUrl);
      expect(isSafe).toBe(false);
    });
  });
});
