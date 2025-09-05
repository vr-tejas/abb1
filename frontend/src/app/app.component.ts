import { Component } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { MatToolbarModule } from '@angular/material/toolbar';
import { MatIconModule } from '@angular/material/icon';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, MatToolbarModule, MatIconModule],
  template: `
    <mat-toolbar color="primary">
      <mat-icon>analytics</mat-icon>
      <span style="margin-left: 8px;">IntelliInspect</span>
      <span style="flex: 1;"></span>
      <span style="font-size: 0.9rem;">Real-Time Predictive Quality Control</span>
    </mat-toolbar>
    
    <div class="container">
      <router-outlet></router-outlet>
    </div>
  `,
  styles: [`
    .container {
      max-width: 1200px;
      margin: 0 auto;
      padding: 20px;
    }
  `]
})
export class AppComponent {
  title = 'IntelliInspect';
}
