import { Component } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../services/api.service';
import { Dataset } from '../../models/dataset.model';

@Component({
  selector: 'app-upload',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule
  ],
  template: `
    <div class="step-content">
      <div class="step-header">
        <div class="step-number">1</div>
        <div class="step-title">Dataset Upload</div>
      </div>
      
      <div *ngIf="!dataset && !isUploading">
        <p>Upload your Kaggle CSV dataset to begin the quality control analysis.</p>
        
        <div class="upload-area" (click)="fileInput.click()" 
             (dragover)="onDragOver($event)" 
             (dragleave)="onDragLeave($event)"
             (drop)="onDrop($event)"
             [class.drag-over]="isDragOver">
          <mat-icon>cloud_upload</mat-icon>
          <p>Drop your CSV file here or click to browse</p>
          <small>Only CSV files are supported</small>
        </div>
        
        <input #fileInput type="file" accept=".csv" (change)="onFileSelected($event)" style="display: none;">
      </div>
      
      <div *ngIf="isUploading" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Processing your dataset...</p>
      </div>
      
      <div *ngIf="dataset && !isUploading">
        <div class="success-message">
          <mat-icon class="success-icon">check_circle</mat-icon>
          Dataset uploaded successfully!
        </div>
        
        <h3>Dataset Metadata</h3>
        <div class="metadata-grid">
          <div class="metadata-card">
            <div class="metadata-label">File Name</div>
            <div class="metadata-value">{{dataset.fileName}}</div>
          </div>
          <div class="metadata-card">
            <div class="metadata-label">Total Rows</div>
            <div class="metadata-value">{{dataset.totalRows | number}}</div>
          </div>
          <div class="metadata-card">
            <div class="metadata-label">Total Columns</div>
            <div class="metadata-value">{{dataset.totalColumns | number}}</div>
          </div>
          <div class="metadata-card">
            <div class="metadata-label">Pass Rate</div>
            <div class="metadata-value">{{(dataset.passRate * 100).toFixed(1)}}%</div>
          </div>
          <div class="metadata-card">
            <div class="metadata-label">Earliest Timestamp</div>
            <div class="metadata-value">{{formatDate(dataset.earliestTimestamp)}}</div>
          </div>
          <div class="metadata-card">
            <div class="metadata-label">Latest Timestamp</div>
            <div class="metadata-value">{{formatDate(dataset.latestTimestamp)}}</div>
          </div>
        </div>
        
        <div class="button-container">
          <button mat-raised-button (click)="uploadAnother()">Upload Another</button>
          <button mat-raised-button color="primary" class="next-button" (click)="nextStep()">
            Next Step
            <mat-icon>arrow_forward</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .upload-area {
      border: 2px dashed #ccc;
      border-radius: 8px;
      padding: 40px;
      text-align: center;
      cursor: pointer;
      transition: all 0.3s ease;
      background: #fafafa;
    }
    
    .upload-area:hover {
      border-color: #3f51b5;
      background: #f0f0ff;
    }
    
    .upload-area.drag-over {
      border-color: #3f51b5;
      background: #f0f0ff;
    }
    
    .upload-area mat-icon {
      font-size: 48px;
      width: 48px;
      height: 48px;
      color: #666;
      margin-bottom: 16px;
    }
    
    .loading-container {
      text-align: center;
      padding: 40px;
    }
    
    .loading-container p {
      margin-top: 16px;
      color: #666;
    }
  `]
})
export class UploadComponent {
  dataset: Dataset | null = null;
  isUploading = false;
  isDragOver = false;

  constructor(
    private apiService: ApiService,
    private router: Router,
    private snackBar: MatSnackBar
  ) {}

  onDragOver(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = true;
  }

  onDragLeave(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
  }

  onDrop(event: DragEvent) {
    event.preventDefault();
    this.isDragOver = false;
    
    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.uploadFile(files[0]);
    }
  }

  onFileSelected(event: any) {
    const file = event.target.files[0];
    if (file) {
      this.uploadFile(file);
    }
  }

  uploadFile(file: File) {
    if (!file.name.toLowerCase().endsWith('.csv')) {
      this.snackBar.open('Please select a CSV file', 'Close', { duration: 3000 });
      return;
    }

    this.isUploading = true;
    this.dataset = null;

    this.apiService.uploadDataset(file).subscribe({
      next: (dataset) => {
        this.dataset = dataset;
        this.isUploading = false;
      },
      error: (error) => {
        console.error('Upload error:', error);
        this.snackBar.open('Upload failed. Please try again.', 'Close', { duration: 5000 });
        this.isUploading = false;
      }
    });
  }

  uploadAnother() {
    this.dataset = null;
  }

  nextStep() {
    if (this.dataset) {
      this.router.navigate(['/date-ranges', this.dataset.datasetId]);
    }
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }
}
