import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { SharedModule } from '../../../shared/shared.module';

@Component({
  selector: 'app-online-seminar',
  standalone: true,
  imports: [SharedModule, CommonModule],
  templateUrl: './online-seminar.component.html',
  styleUrls: ['./online-seminar.component.scss']
})
export class OnlineSeminarComponent {
  showDateNotScheduledModal: boolean = false;
  calendarLink: string = ''; // Set this to a URL when calendar link is available

  /**
   * Check if calendar link is valid and available
   */
  get hasCalendarLink(): boolean {
    return !!(this.calendarLink && this.calendarLink.trim());
  }

  /**
   * Dynamically set button label based on whether calendar link exists
   */
  get buttonLabel(): string {
    return this.hasCalendarLink ? 'Join the guestlist' : 'Add to calendar';
  }

  /**
   * Handle button click - performs appropriate action based on link availability
   */
  onButtonClick(): void {
    if (this.hasCalendarLink) {
      // If calendar link exists, open it in a new tab
      window.open(this.calendarLink, '_blank');
    } else {
      // If no calendar link, show modal with message about dates not being finalized
      this.showDateNotScheduledModal = true;
    }
  }

  /**
   * Close the modal
   */
  closeModal(): void {
    this.showDateNotScheduledModal = false;
  }
}
