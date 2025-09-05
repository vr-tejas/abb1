import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { FormBuilder, FormGroup, ReactiveFormsModule, Validators } from '@angular/forms';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatFormFieldModule } from '@angular/material/form-field';
import { MatInputModule } from '@angular/material/input';
import { MatDatepickerModule } from '@angular/material/datepicker';
import { MatNativeDateModule } from '@angular/material/core';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { ApiService } from '../../services/api.service';
import { Dataset, DateRangeRequest, DateRangeResponse } from '../../models/dataset.model';

@Component({
  selector: 'app-date-ranges',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatFormFieldModule,
    MatInputModule,
    MatDatepickerModule,
    MatNativeDateModule,
    MatSnackBarModule
  ],
  template: `
    <div class="step-content">
      <div class="step-header">
        <div class="step-number">2</div>
        <div class="step-title">Date Range Selection</div>
      </div>
      
      <div *ngIf="dataset">
        <p>Select date ranges for training, testing, and simulation phases. Ranges must not overlap and must be in sequence.</p>
        
        <div class="date-info">
          <strong>Available Data Range:</strong> 
          {{formatDate(dataset.earliestTimestamp)}} to {{formatDate(dataset.latestTimestamp)}}
        </div>
        
        <form [formGroup]="dateForm" (ngSubmit)="validateRanges()">
          <div class="date-section">
            <h3>Training Phase</h3>
            <div class="date-inputs">
              <mat-form-field>
                <mat-label>Start Date</mat-label>
                <input matInput [matDatepicker]="trainingStartPicker" formControlName="trainingStartDate" required>
                <mat-datepicker-toggle matIconSuffix [for]="trainingStartPicker"></mat-datepicker-toggle>
                <mat-datepicker #trainingStartPicker></mat-datepicker>
              </mat-form-field>
              
              <mat-form-field>
                <mat-label>End Date</mat-label>
                <input matInput [matDatepicker]="trainingEndPicker" formControlName="trainingEndDate" required>
                <mat-datepicker-toggle matIconSuffix [for]="trainingEndPicker"></mat-datepicker-toggle>
                <mat-datepicker #trainingEndPicker></mat-datepicker>
              </mat-form-field>
            </div>
          </div>
          
          <div class="date-section">
            <h3>Testing Phase</h3>
            <div class="date-inputs">
              <mat-form-field>
                <mat-label>Start Date</mat-label>
                <input matInput [matDatepicker]="testingStartPicker" formControlName="testingStartDate" required>
                <mat-datepicker-toggle matIconSuffix [for]="testingStartPicker"></mat-datepicker-toggle>
                <mat-datepicker #testingStartPicker></mat-datepicker>
              </mat-form-field>
              
              <mat-form-field>
                <mat-label>End Date</mat-label>
                <input matInput [matDatepicker]="testingEndPicker" formControlName="testingEndDate" required>
                <mat-datepicker-toggle matIconSuffix [for]="testingEndPicker"></mat-datepicker-toggle>
                <mat-datepicker #testingEndPicker></mat-datepicker>
              </mat-form-field>
            </div>
          </div>
          
          <div class="date-section">
            <h3>Simulation Phase</h3>
            <div class="date-inputs">
              <mat-form-field>
                <mat-label>Start Date</mat-label>
                <input matInput [matDatepicker]="simulationStartPicker" formControlName="simulationStartDate" required>
                <mat-datepicker-toggle matIconSuffix [for]="simulationStartPicker"></mat-datepicker-toggle>
                <mat-datepicker #simulationStartPicker></mat-datepicker>
              </mat-form-field>
              
              <mat-form-field>
                <mat-label>End Date</mat-label>
                <input matInput [matDatepicker]="simulationEndPicker" formControlName="simulationEndDate" required>
                <mat-datepicker-toggle matIconSuffix [for]="simulationEndPicker"></mat-datepicker-toggle>
                <mat-datepicker #simulationEndPicker></mat-datepicker>
              </mat-form-field>
            </div>
          </div>
          
          <div class="button-container">
            <button mat-raised-button type="button" (click)="goBack()">
              <mat-icon>arrow_back</mat-icon>
              Back
            </button>
            <button mat-raised-button color="primary" type="submit" [disabled]="dateForm.invalid">
              Validate Ranges
            </button>
          </div>
        </form>
        
        <div *ngIf="validationResult" class="validation-result">
          <div *ngIf="validationResult.isValid" class="success-message">
            <mat-icon class="success-icon">check_circle</mat-icon>
            Date ranges are valid!
          </div>
          
          <div *ngIf="!validationResult.isValid" class="error-message">
            <mat-icon>error</mat-icon>
            {{validationResult.errorMessage}}
          </div>
          
          <div *ngIf="validationResult.isValid" class="record-counts">
            <h3>Record Counts</h3>
            <div class="metadata-grid">
              <div class="metadata-card">
                <div class="metadata-label">Training Records</div>
                <div class="metadata-value">{{validationResult.trainingRecordCount | number}}</div>
              </div>
              <div class="metadata-card">
                <div class="metadata-label">Testing Records</div>
                <div class="metadata-value">{{validationResult.testingRecordCount | number}}</div>
              </div>
              <div class="metadata-card">
                <div class="metadata-label">Simulation Records</div>
                <div class="metadata-value">{{validationResult.simulationRecordCount | number}}</div>
              </div>
            </div>
            
            <div class="button-container">
              <div></div>
              <button mat-raised-button color="primary" class="next-button" (click)="nextStep()">
                Next Step
                <mat-icon>arrow_forward</mat-icon>
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .date-info {
      background: #e3f2fd;
      padding: 12px;
      border-radius: 4px;
      margin: 16px 0;
      border-left: 4px solid #2196f3;
    }
    
    .date-section {
      margin: 24px 0;
      padding: 16px;
      border: 1px solid #e0e0e0;
      border-radius: 4px;
    }
    
    .date-section h3 {
      margin: 0 0 16px 0;
      color: #333;
    }
    
    .date-inputs {
      display: flex;
      gap: 16px;
      flex-wrap: wrap;
    }
    
    .date-inputs mat-form-field {
      flex: 1;
      min-width: 200px;
    }
    
    .validation-result {
      margin-top: 24px;
      padding-top: 16px;
      border-top: 1px solid #e0e0e0;
    }
    
    .error-message {
      display: flex;
      align-items: center;
      padding: 16px;
      background: #ffebee;
      color: #c62828;
      border-radius: 4px;
      margin-bottom: 16px;
    }
    
    .error-message mat-icon {
      margin-right: 8px;
    }
    
    .record-counts {
      margin-top: 16px;
    }
  `]
})
export class DateRangesComponent implements OnInit {
  dataset: Dataset | null = null;
  dateForm: FormGroup;
  validationResult: DateRangeResponse | null = null;
  datasetId!: number;

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private fb: FormBuilder,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {
    this.dateForm = this.fb.group({
      trainingStartDate: ['', Validators.required],
      trainingEndDate: ['', Validators.required],
      testingStartDate: ['', Validators.required],
      testingEndDate: ['', Validators.required],
      simulationStartDate: ['', Validators.required],
      simulationEndDate: ['', Validators.required]
    });
  }

  ngOnInit() {
    this.datasetId = Number(this.route.snapshot.paramMap.get('id'));
    this.loadDataset();
  }

  loadDataset() {
    this.apiService.getDataset(this.datasetId).subscribe({
      next: (dataset) => {
        this.dataset = dataset;
      },
      error: (error) => {
        console.error('Error loading dataset:', error);
        this.snackBar.open('Error loading dataset', 'Close', { duration: 3000 });
      }
    });
  }

  validateRanges() {
    if (this.dateForm.valid) {
      const request: DateRangeRequest = {
        datasetId: this.datasetId,
        trainingStartDate: this.dateForm.value.trainingStartDate,
        trainingEndDate: this.dateForm.value.trainingEndDate,
        testingStartDate: this.dateForm.value.testingStartDate,
        testingEndDate: this.dateForm.value.testingEndDate,
        simulationStartDate: this.dateForm.value.simulationStartDate,
        simulationEndDate: this.dateForm.value.simulationEndDate
      };

      this.apiService.validateDateRanges(request).subscribe({
        next: (result) => {
          this.validationResult = result;
        },
        error: (error) => {
          console.error('Validation error:', error);
          this.snackBar.open('Validation failed. Please try again.', 'Close', { duration: 3000 });
        }
      });
    }
  }

  goBack() {
    this.router.navigate(['/upload']);
  }

  nextStep() {
    this.router.navigate(['/training', this.datasetId]);
  }

  formatDate(date: Date | undefined): string {
    if (!date) return 'N/A';
    return new Date(date).toLocaleDateString();
  }
}
