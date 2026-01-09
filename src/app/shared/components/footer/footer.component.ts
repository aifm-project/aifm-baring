import { Component } from '@angular/core';

@Component({
  selector: 'app-footer',
  standalone: true,
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent {
  // Social links
  linkedin: string = "https://www.linkedin.com/company/baring-private-equity-partners-india/?viewAsMember=true";
  youtube: string = ""; // Add YouTube channel URL here

  // Legal and support links
  privacyPolicy: string = ""; // Add privacy policy URL here
  terms_of_use: string = ""; // Add terms of use URL here
  disclaimer: string = ""; // Add disclaimer URL here
  contact: string = ""; // Add contact page URL here

  year: string = new Date().getFullYear().toString();

  constructor() {}
}
