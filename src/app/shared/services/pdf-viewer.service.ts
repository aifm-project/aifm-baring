import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

export interface PdfViewerConfig {
  url?: string;
  blob?: Blob;
  fileName?: string;
  downloadFileName?: string;
  isOpen: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class PdfViewerService {
  private pdfConfig = new BehaviorSubject<PdfViewerConfig>({
    isOpen: false
  });

  pdfConfig$ = this.pdfConfig.asObservable();

  constructor() {}

  openPdf(url: string, fileName: string, downloadFileName?: string): void {
    this.pdfConfig.next({
      url,
      fileName,
      downloadFileName: downloadFileName || fileName,
      isOpen: true
    });
  }

  openPdfBlob(blob: Blob, fileName: string, downloadFileName?: string): void {
    this.pdfConfig.next({
      blob,
      fileName,
      downloadFileName: downloadFileName || fileName,
      isOpen: true
    });
  }

  closePdf(): void {
    this.pdfConfig.next({
      isOpen: false
    });
  }

  getCurrentConfig(): PdfViewerConfig {
    return this.pdfConfig.value;
  }
}
