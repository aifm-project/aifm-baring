import { Component, OnInit } from '@angular/core';

interface Document {
  id: string;
  title: string;
  type: 'report' | 'presentation' | 'legal' | 'financial' | 'other';
  category: string;
  uploadDate: Date;
  size: string;
  downloadCount: number;
  isRestricted: boolean;
  description: string;
  tags: string[];
}

@Component({
  selector: 'app-documents',
  templateUrl: './documents.component.html',
  styleUrls: ['./documents.component.scss']
})
export class DocumentsComponent implements OnInit {
  documents: Document[] = [
    {
      id: '1',
      title: 'Q4 2023 Portfolio Performance Report',
      type: 'report',
      category: 'Performance Reports',
      uploadDate: new Date('2024-01-15'),
      size: '2.4 MB',
      downloadCount: 156,
      isRestricted: false,
      description: 'Comprehensive quarterly performance analysis of all portfolio companies.',
      tags: ['Q4 2023', 'Performance', 'Portfolio']
    },
    {
      id: '2',
      title: 'Fund VII Investment Strategy Presentation',
      type: 'presentation',
      category: 'Investment Strategy',
      uploadDate: new Date('2024-01-10'),
      size: '8.7 MB',
      downloadCount: 89,
      isRestricted: true,
      description: 'Strategic overview and investment thesis for Fund VII.',
      tags: ['Fund VII', 'Strategy', 'Investment']
    },
    {
      id: '3',
      title: 'ESG Policy Framework 2024',
      type: 'legal',
      category: 'ESG & Compliance',
      uploadDate: new Date('2024-01-05'),
      size: '1.8 MB',
      downloadCount: 234,
      isRestricted: false,
      description: 'Updated environmental, social, and governance policy framework.',
      tags: ['ESG', 'Policy', '2024', 'Compliance']
    },
    {
      id: '4',
      title: 'Annual Financial Statements 2023',
      type: 'financial',
      category: 'Financial Reports',
      uploadDate: new Date('2023-12-20'),
      size: '5.2 MB',
      downloadCount: 312,
      isRestricted: true,
      description: 'Audited financial statements for the fiscal year 2023.',
      tags: ['2023', 'Financial', 'Annual', 'Audited']
    },
    {
      id: '5',
      title: 'Market Outlook Asia Pacific 2024',
      type: 'report',
      category: 'Market Research',
      uploadDate: new Date('2023-12-15'),
      size: '3.1 MB',
      downloadCount: 178,
      isRestricted: false,
      description: 'Comprehensive market analysis and outlook for Asia Pacific region.',
      tags: ['Market', 'Asia Pacific', '2024', 'Outlook']
    }
  ];

  filteredDocuments: Document[] = [];
  selectedCategory = 'All';
  selectedType = 'All';
  searchTerm = '';

  categories = ['All', 'Performance Reports', 'Investment Strategy', 'ESG & Compliance', 'Financial Reports', 'Market Research'];
  types = ['All', 'report', 'presentation', 'legal', 'financial', 'other'];

  ngOnInit(): void {
    this.filteredDocuments = [...this.documents];
  }

  applyFilters(): void {
    this.filteredDocuments = this.documents.filter(doc => {
      const categoryMatch = this.selectedCategory === 'All' || doc.category === this.selectedCategory;
      const typeMatch = this.selectedType === 'All' || doc.type === this.selectedType;
      const searchMatch = this.searchTerm === '' || 
        doc.title.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        doc.description.toLowerCase().includes(this.searchTerm.toLowerCase()) ||
        doc.tags.some(tag => tag.toLowerCase().includes(this.searchTerm.toLowerCase()));
      
      return categoryMatch && typeMatch && searchMatch;
    });
  }

  downloadDocument(document: Document): void {
    if (document.isRestricted) {
      // Handle restricted document access
      console.log(`Access requested for restricted document: ${document.title}`);
    } else {
      document.downloadCount++;
      console.log(`Downloading document: ${document.title}`);
    }
  }

  getTypeIcon(type: string): string {
    switch (type) {
      case 'report': return 'pi pi-file-pdf';
      case 'presentation': return 'pi pi-file-powerpoint';
      case 'legal': return 'pi pi-file-word';
      case 'financial': return 'pi pi-file-excel';
      default: return 'pi pi-file';
    }
  }

  getTypeClass(type: string): string {
    switch (type) {
      case 'report': return 'type-report';
      case 'presentation': return 'type-presentation';
      case 'legal': return 'type-legal';
      case 'financial': return 'type-financial';
      default: return 'type-other';
    }
  }
}