import { Component } from '@angular/core';

interface FooterLink {
  label: string;
  url: string;
}

interface FooterSection {
  title: string;
  links: FooterLink[];
}

@Component({
  selector: 'app-footer',
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  currentYear = new Date().getFullYear();
  
  footerSections: FooterSection[] = [
    {
      title: 'About Us',
      links: [
        { label: 'Our Story', url: '/about' },
        { label: 'Leadership Team', url: '/team' },
        { label: 'Investment Philosophy', url: '/philosophy' },
        { label: 'Careers', url: '/careers' }
      ]
    },
    {
      title: 'Investments',
      links: [
        { label: 'Portfolio Companies', url: '/portfolio' },
        { label: 'Investment Strategy', url: '/strategy' },
        { label: 'Sectors', url: '/sectors' },
        { label: 'Geographic Focus', url: '/regions' }
      ]
    },
    {
      title: 'Resources',
      links: [
        { label: 'Market Insights', url: '/insights' },
        { label: 'Research Reports', url: '/research' },
        { label: 'Newsletter', url: '/newsletter' },
        { label: 'Events', url: '/events' }
      ]
    },
    {
      title: 'Contact',
      links: [
        { label: 'Contact Us', url: '/contact' },
        { label: 'Office Locations', url: '/locations' },
        { label: 'Investor Relations', url: '/investor-relations' },
        { label: 'Media Inquiries', url: '/media' }
      ]
    }
  ];

  socialLinks = [
    { icon: 'pi pi-linkedin', url: 'https://linkedin.com/company/baring-private-equity', label: 'LinkedIn' },
    { icon: 'pi pi-twitter', url: 'https://twitter.com/baringpe', label: 'Twitter' },
    { icon: 'pi pi-youtube', url: 'https://youtube.com/baringpe', label: 'YouTube' }
  ];

  legalLinks: FooterLink[] = [
    { label: 'Privacy Policy', url: '/privacy' },
    { label: 'Terms of Service', url: '/terms' },
    { label: 'Cookie Policy', url: '/cookies' },
    { label: 'Disclaimer', url: '/disclaimer' }
  ];
}