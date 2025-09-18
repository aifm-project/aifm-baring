import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { TopNavbarComponent } from './components/top-navbar/top-navbar.component';

@Component({
  selector: 'app-root',
  imports: [RouterOutlet, TopNavbarComponent],
  templateUrl: './app.html',
  styleUrl: './app.scss'
})
export class App {
  protected readonly title = signal('BPEP');
}
