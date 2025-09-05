import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData, registerables } from 'chart.js';
import { ApiService } from '../../services/api.service';
import { TrainingResponse } from '../../models/dataset.model';

Chart.register(...registerables);

@Component({
  selector: 'app-training',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    BaseChartDirective
  ],
  template: `
    <div class="step-content">
      <div class="step-header">
        <div class="step-number">3</div>
        <div class="step-title">Model Training</div>
      </div>
      
      <div *ngIf="!isTraining && !trainingResult">
        <p>Ready to train the machine learning model using your selected date ranges.</p>
        
        <div class="button-container">
          <button mat-raised-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            Back
          </button>
          <button mat-raised-button color="primary" (click)="startTraining()">
            <mat-icon>model_training</mat-icon>
            Start Training
          </button>
        </div>
      </div>
      
      <div *ngIf="isTraining" class="training-progress">
        <mat-spinner diameter="60"></mat-spinner>
        <h3>Training Model...</h3>
        <p>Please wait while we train the XGBoost model on your data.</p>
      </div>
      
      <div *ngIf="trainingResult && !isTraining">
        <div class="success-message">
          <mat-icon class="success-icon">check_circle</mat-icon>
          Model trained successfully!
        </div>
        
        <div class="metrics-section">
          <h3>Model Performance Metrics</h3>
          <div class="metrics-grid">
            <div class="metric-card">
              <div class="metric-value">{{(trainingResult.accuracy * 100).toFixed(1)}}%</div>
              <div class="metric-label">Accuracy</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">{{(trainingResult.precision * 100).toFixed(1)}}%</div>
              <div class="metric-label">Precision</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">{{(trainingResult.recall * 100).toFixed(1)}}%</div>
              <div class="metric-label">Recall</div>
            </div>
            <div class="metric-card">
              <div class="metric-value">{{(trainingResult.f1Score * 100).toFixed(1)}}%</div>
              <div class="metric-label">F1 Score</div>
            </div>
          </div>
        </div>
        
        <div class="charts-section">
          <h3>Model Analysis</h3>
          
          <div class="chart-container">
            <h4>Training Performance</h4>
            <canvas baseChart
                    [data]="trainingChartData"
                    [options]="trainingChartOptions"
                    [type]="'line'">
            </canvas>
          </div>
          
          <div class="chart-container" *ngIf="confusionMatrixData">
            <h4>Confusion Matrix</h4>
            <canvas baseChart
                    [data]="confusionMatrixData"
                    [options]="confusionMatrixOptions"
                    [type]="'bar'">
            </canvas>
          </div>
        </div>
        
        <div class="button-container">
          <button mat-raised-button (click)="trainAnother()">
            <mat-icon>refresh</mat-icon>
            Train Another
          </button>
          <button mat-raised-button color="primary" class="next-button" (click)="nextStep()">
            Next Step
            <mat-icon>arrow_forward</mat-icon>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .training-progress {
      text-align: center;
      padding: 40px;
    }
    
    .training-progress h3 {
      margin: 16px 0 8px 0;
      color: #333;
    }
    
    .training-progress p {
      color: #666;
      margin: 0;
    }
    
    .metrics-section {
      margin: 24px 0;
    }
    
    .metrics-grid {
      display: grid;
      grid-template-columns: repeat(auto-fit, minmax(150px, 1fr));
      gap: 16px;
      margin: 16px 0;
    }
    
    .metric-card {
      background: #f8f9fa;
      padding: 20px;
      border-radius: 8px;
      text-align: center;
      border: 1px solid #e0e0e0;
    }
    
    .metric-value {
      font-size: 2rem;
      font-weight: bold;
      color: #3f51b5;
      margin-bottom: 8px;
    }
    
    .metric-label {
      font-size: 0.875rem;
      color: #666;
      font-weight: 500;
    }
    
    .charts-section {
      margin: 24px 0;
    }
    
    .chart-container {
      background: white;
      padding: 20px;
      border-radius: 8px;
      border: 1px solid #e0e0e0;
      margin: 16px 0;
    }
    
    .chart-container h4 {
      margin: 0 0 16px 0;
      color: #333;
    }
  `]
})
export class TrainingComponent implements OnInit {
  datasetId!: number;
  isTraining = false;
  trainingResult: TrainingResponse | null = null;
  
  // Chart data
  trainingChartData: ChartData<'line'> = {
    labels: [],
    datasets: []
  };
  
  trainingChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true,
        max: 1
      }
    },
    plugins: {
      legend: {
        display: true
      }
    }
  };
  
  confusionMatrixData: ChartData<'bar'> | null = null;
  confusionMatrixOptions: ChartConfiguration<'bar'>['options'] = {
    responsive: true,
    scales: {
      y: {
        beginAtZero: true
      }
    },
    plugins: {
      legend: {
        display: false
      }
    }
  };

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.datasetId = Number(this.route.snapshot.paramMap.get('id'));
  }

  startTraining() {
    this.isTraining = true;
    this.trainingResult = null;

    this.apiService.trainModel(this.datasetId).subscribe({
      next: (result) => {
        this.trainingResult = result;
        this.isTraining = false;
        this.setupCharts();
      },
      error: (error) => {
        console.error('Training error:', error);
        this.snackBar.open('Training failed. Please try again.', 'Close', { duration: 5000 });
        this.isTraining = false;
      }
    });
  }

  setupCharts() {
    if (!this.trainingResult) return;

    // Setup training performance chart (simulated data)
    this.trainingChartData = {
      labels: ['Epoch 1', 'Epoch 2', 'Epoch 3', 'Epoch 4', 'Epoch 5'],
      datasets: [
        {
          label: 'Training Accuracy',
          data: [0.7, 0.8, 0.85, 0.9, this.trainingResult.accuracy],
          borderColor: '#3f51b5',
          backgroundColor: 'rgba(63, 81, 181, 0.1)',
          fill: true
        },
        {
          label: 'Validation Loss',
          data: [0.8, 0.6, 0.4, 0.3, 1 - this.trainingResult.accuracy],
          borderColor: '#f44336',
          backgroundColor: 'rgba(244, 67, 54, 0.1)',
          fill: true
        }
      ]
    };

    // Setup confusion matrix chart
    if (this.trainingResult.confusionMatrix && this.trainingResult.confusionMatrix.length > 0) {
      const matrix = this.trainingResult.confusionMatrix;
      this.confusionMatrixData = {
        labels: ['Predicted Fail', 'Predicted Pass'],
        datasets: [
          {
            label: 'Actual Fail',
            data: matrix[0] || [0, 0],
            backgroundColor: '#f44336'
          },
          {
            label: 'Actual Pass',
            data: matrix[1] || [0, 0],
            backgroundColor: '#4caf50'
          }
        ]
      };
    }
  }

  trainAnother() {
    this.trainingResult = null;
    this.isTraining = false;
  }

  goBack() {
    this.router.navigate(['/date-ranges', this.datasetId]);
  }

  nextStep() {
    this.router.navigate(['/simulation', this.datasetId]);
  }
}
