import { Component } from '@angular/core';
import { FormsModule } from '@angular/forms';

@Component({
  selector: 'app-newsletter',
  standalone: true,
  imports: [FormsModule],
  templateUrl: './newsletter.component.html',
  styleUrls: ['./newsletter.component.scss']
})
export class NewsletterComponent {
  email: string = '';

  constructor() {}

  onSubmit() {
    if (this.email) {
      console.log('Newsletter subscription:', this.email);
      // Handle newsletter subscription logic here
      this.email = '';
    }
  }
}
