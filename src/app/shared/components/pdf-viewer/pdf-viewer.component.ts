import { Component, OnInit, ViewChild, ChangeDetectorRef, CUSTOM_ELEMENTS_SCHEMA, Input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NgxExtendedPdfViewerModule } from 'ngx-extended-pdf-viewer';
import { PdfViewerService, PdfViewerConfig } from '../../services/pdf-viewer.service';

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

  config: PdfViewerConfig | null = null;
  isFullscreen = false;
  currentPage = 1;
  totalPages = 0;
  searchText = '';
  searchEnabled = true;
  zoomLevel = 100;
  @Input() pdfUrl: string | undefined;

  constructor(
    private pdfViewerService: PdfViewerService,
    private cdr: ChangeDetectorRef
  ) {}

  ngOnInit(): void {
    // If filePath is provided via @Input, open it directly
    if (this.filePath) {
      const fileName = this.extractFileName(this.filePath);
      this.pdfViewerService.openPdf(this.filePath, fileName);
    }

    this.pdfViewerService.pdfConfig$.subscribe(config => {
      this.config = config;
      if (config.url) {
        this.pdfUrl = config.url;
      } else if (config.blob) {
       this.pdfUrl = URL.createObjectURL(config.blob)
      }
      // this.cdr.detectChanges();
    });
  }

  private extractFileName(filePath: string): string {
    if (!filePath) return 'document.pdf';
    const parts = filePath.split('/');
    const lastPart = parts[parts.length - 1];
    return lastPart.includes('.') ? lastPart : `${lastPart}.pdf`;
  }

  closePdf(): void {
    this.pdfViewerService.closePdf();
  }

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

  zoomIn(): void {
    this.zoomLevel = Math.min(this.zoomLevel + 10, 400);
  }

  zoomOut(): void {
    this.zoomLevel = Math.max(this.zoomLevel - 10, 100);
  }

  downloadPdf(): void {
    if (!this.config?.fileName || !this.pdfUrl) return;

    const link = document.createElement('a');
    link.href = this.pdfUrl;
    link.download = this.config.fileName;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  }

  onPdfLoaded(): void {
    // PDF loaded event handler
  }

  onSearch(event: any): void {
    // Search implementation - highlights are automatic in ngx-extended-pdf-viewer
  }

  resetZoom(): void {
    this.zoomLevel = 100;
  }
}
