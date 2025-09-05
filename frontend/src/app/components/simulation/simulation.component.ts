import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, Router } from '@angular/router';
import { MatCardModule } from '@angular/material/card';
import { MatButtonModule } from '@angular/material/button';
import { MatIconModule } from '@angular/material/icon';
import { MatTableModule } from '@angular/material/table';
import { MatProgressSpinnerModule } from '@angular/material/progress-spinner';
import { MatSnackBarModule, MatSnackBar } from '@angular/material/snack-bar';
import { BaseChartDirective } from 'ng2-charts';
import { Chart, ChartConfiguration, ChartData } from 'chart.js';
import { ApiService } from '../../services/api.service';
import { SimulationRow } from '../../models/dataset.model';

@Component({
  selector: 'app-simulation',
  standalone: true,
  imports: [
    CommonModule,
    MatCardModule,
    MatButtonModule,
    MatIconModule,
    MatTableModule,
    MatProgressSpinnerModule,
    MatSnackBarModule,
    BaseChartDirective
  ],
  template: `
    <div class="step-content">
      <div class="step-header">
        <div class="step-number">4</div>
        <div class="step-title">Real-Time Simulation</div>
      </div>
      
      <div *ngIf="!simulationData.length && !isLoading">
        <p>Ready to start real-time quality control simulation using the trained model.</p>
        
        <div class="button-container">
          <button mat-raised-button (click)="goBack()">
            <mat-icon>arrow_back</mat-icon>
            Back
          </button>
          <button mat-raised-button color="primary" (click)="startSimulation()">
            <mat-icon>play_arrow</mat-icon>
            Start Simulation
          </button>
        </div>
      </div>
      
      <div *ngIf="isLoading && !simulationData.length" class="loading-container">
        <mat-spinner diameter="50"></mat-spinner>
        <p>Loading simulation data...</p>
      </div>
      
      <div *ngIf="simulationData.length > 0">
        <!-- Statistics -->
        <div class="simulation-stats">
          <div class="stat-card">
            <span class="stat-value">{{processedRows}}</span>
            <div class="stat-label">Processed</div>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{passCount}}</span>
            <div class="stat-label">Pass</div>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{failCount}}</span>
            <div class="stat-label">Fail</div>
          </div>
          <div class="stat-card">
            <span class="stat-value">{{averageConfidence.toFixed(1)}}%</span>
            <div class="stat-label">Avg Confidence</div>
          </div>
        </div>
        
        <!-- Charts -->
        <div class="charts-grid">
          <div class="chart-container">
            <h4>Real-Time Predictions</h4>
            <canvas baseChart
                    [data]="lineChartData"
                    [options]="lineChartOptions"
                    [type]="'line'">
            </canvas>
          </div>
          
          <div class="chart-container">
            <h4>Pass/Fail Distribution</h4>
            <canvas baseChart
                    [data]="donutChartData"
                    [options]="donutChartOptions"
                    [type]="'doughnut'">
            </canvas>
          </div>
        </div>
        
        <!-- Live Data Table -->
        <div class="table-container">
          <h4>Live Prediction Results</h4>
          <table mat-table [dataSource]="recentRows" class="prediction-table">
            <ng-container matColumnDef="rowIndex">
              <th mat-header-cell *matHeaderCellDef>Row</th>
              <td mat-cell *matCellDef="let row">{{row.rowIndex + 1}}</td>
            </ng-container>
            
            <ng-container matColumnDef="timestamp">
              <th mat-header-cell *matHeaderCellDef>Timestamp</th>
              <td mat-cell *matCellDef="let row">{{formatTime(row.timestamp)}}</td>
            </ng-container>
            
            <ng-container matColumnDef="prediction">
              <th mat-header-cell *matHeaderCellDef>Prediction</th>
              <td mat-cell *matCellDef="let row">
                <span [class]="getPredictionClass(row.prediction)">
                  {{row.prediction === 1 ? 'PASS' : 'FAIL'}}
                </span>
              </td>
            </ng-container>
            
            <ng-container matColumnDef="confidence">
              <th mat-header-cell *matHeaderCellDef>Confidence</th>
              <td mat-cell *matCellDef="let row">{{(row.confidence * 100).toFixed(1)}}%</td>
            </ng-container>
            
            <tr mat-header-row *matHeaderRowDef="displayedColumns"></tr>
            <tr mat-row *matRowDef="let row; columns: displayedColumns;"></tr>
          </table>
        </div>
        
        <!-- Simulation Status -->
        <div *ngIf="isRunning" class="simulation-status">
          <mat-spinner diameter="24"></mat-spinner>
          <span>Simulation running... ({{processedRows}} of {{simulationData.length}})</span>
          <button mat-button color="warn" (click)="stopSimulation()">
            <mat-icon>stop</mat-icon>
            Stop
          </button>
        </div>
        
        <div *ngIf="isCompleted" class="success-message">
          <mat-icon class="success-icon">check_circle</mat-icon>
          ✓ Simulation completed successfully!
        </div>
        
        <div class="button-container" *ngIf="!isRunning">
          <button mat-raised-button (click)="restartSimulation()">
            <mat-icon>refresh</mat-icon>
            Restart Simulation
          </button>
          <button mat-raised-button color="primary" (click)="goToStart()" *ngIf="isCompleted">
            <mat-icon>home</mat-icon>
            Start Over
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .loading-container {
      text-align: center;
      padding: 40px;
    }
    
    .charts-grid {
      display: grid;
      grid-template-columns: 2fr 1fr;
      gap: 20px;
      margin: 20px 0;
      height: 400px; /* Fixed height to prevent page growing */
    }
    
    .chart-container {
      height: 100%; /* Use full container height */
      display: flex;
      flex-direction: column;
    }
    
    .chart-container canvas {
      flex: 1; /* Chart takes remaining space */
      max-height: 350px; /* Prevent charts from being too tall */
    }
    
    .chart-container h4 {
      margin: 0 0 10px 0; /* Reduce title margin */
      flex-shrink: 0; /* Don't shrink title */
    }
    
    .table-container {
      margin: 20px 0;
    }
    
    .table-container h4 {
      margin-bottom: 16px;
      color: #333;
    }
    
    .prediction-table {
      width: 100%;
      background: white;
    }
    
    .prediction-pass {
      color: #4caf50;
      font-weight: bold;
    }
    
    .prediction-fail {
      color: #f44336;
      font-weight: bold;
    }
    
    .simulation-status {
      display: flex;
      align-items: center;
      gap: 12px;
      padding: 16px;
      background: #e3f2fd;
      border-radius: 4px;
      margin: 20px 0;
    }
    
    .simulation-status span {
      flex: 1;
      font-weight: 500;
    }
    
    @media (max-width: 768px) {
      .charts-grid {
        grid-template-columns: 1fr;
      }
    }
  `]
})
export class SimulationComponent implements OnInit, OnDestroy {
  datasetId!: number;
  simulationData: SimulationRow[] = [];
  processedRowsData: SimulationRow[] = [];
  recentRows: SimulationRow[] = [];
  isLoading = false;
  isRunning = false;
  isCompleted = false;
  currentIndex = 0;
  intervalId?: number;
  
  // Statistics
  processedRowsCount = 0;
  passCount = 0;
  failCount = 0;
  averageConfidence = 0;
  
  get processedRows(): number {
    return this.processedRowsCount;
  }
  
  // Chart data
  lineChartData: ChartData<'line'> = {
    labels: [],
    datasets: [{
      label: 'Confidence %',
      data: [],
      borderColor: '#3f51b5',
      backgroundColor: 'rgba(63, 81, 181, 0.1)',
      fill: false,
      tension: 0.4
    }, {
      label: 'Pass Rate %',
      data: [],
      borderColor: '#4caf50',
      backgroundColor: 'rgba(76, 175, 80, 0.1)',
      fill: false,
      tension: 0.4
    }]
  };
  
  lineChartOptions: ChartConfiguration<'line'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 2, // Wider than tall
    interaction: {
      mode: 'index',
      intersect: false
    },
    scales: {
      y: {
        beginAtZero: true,
        max: 100,
        ticks: {
          callback: function(value) {
            return value + '%';
          }
        }
      },
      x: {
        display: true,
        title: {
          display: true,
          text: 'Time Progress'
        }
      }
    },
    plugins: {
      legend: {
        display: true,
        position: 'top'
      },
      tooltip: {
        mode: 'index',
        intersect: false
      }
    }
  };
  
  donutChartData: ChartData<'doughnut'> = {
    labels: ['Pass', 'Fail'],
    datasets: [{
      data: [0, 0],
      backgroundColor: ['#4caf50', '#f44336'],
      borderWidth: 0
    }]
  };
  
  donutChartOptions: ChartConfiguration<'doughnut'>['options'] = {
    responsive: true,
    maintainAspectRatio: false,
    aspectRatio: 1, // Square aspect ratio
    plugins: {
      legend: {
        position: 'bottom'
      }
    }
  };
  
  displayedColumns = ['rowIndex', 'timestamp', 'prediction', 'confidence'];

  constructor(
    private route: ActivatedRoute,
    private router: Router,
    private apiService: ApiService,
    private snackBar: MatSnackBar
  ) {}

  ngOnInit() {
    this.datasetId = Number(this.route.snapshot.paramMap.get('id'));
  }

  ngOnDestroy() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
  }

  startSimulation() {
    this.isLoading = true;
    
    this.apiService.getSimulationData(this.datasetId).subscribe({
      next: (data) => {
        this.simulationData = data;
        this.isLoading = false;
        this.runSimulation();
      },
      error: (error) => {
        console.error('Error loading simulation data:', error);
        this.snackBar.open('Failed to load simulation data', 'Close', { duration: 3000 });
        this.isLoading = false;
      }
    });
  }

  runSimulation() {
    this.isRunning = true;
    this.currentIndex = 0;
    this.processedRowsCount = 0;
    this.passCount = 0;
    this.failCount = 0;
    this.processedRowsData = [];
    this.recentRows = [];
    
    this.intervalId = window.setInterval(() => {
      if (this.currentIndex < this.simulationData.length) {
        this.processNextRow();
      } else {
        this.completeSimulation();
      }
    }, 1000); // 1 second interval
  }

  processNextRow() {
    const row = this.simulationData[this.currentIndex];
    
    this.apiService.simulateStep(this.datasetId, row).subscribe({
      next: (response) => {
        const processedRow = response.row;
        this.processedRowsData.push(processedRow);
        this.processedRowsCount++;
        
        // Update statistics
        if (processedRow.prediction === 1) {
          this.passCount++;
        } else {
          this.failCount++;
        }
        
        this.updateAverageConfidence();
        this.updateCharts(processedRow);
        this.updateRecentRows(processedRow);
        
        this.currentIndex++;
      },
      error: (error) => {
        console.error('Simulation error:', error);
        this.snackBar.open('Simulation error occurred', 'Close', { duration: 3000 });
      }
    });
  }

  updateAverageConfidence() {
    if (this.processedRowsData.length > 0) {
      const totalConfidence = this.processedRowsData.reduce((sum, row) => sum + (row.confidence || 0), 0);
      this.averageConfidence = (totalConfidence / this.processedRowsData.length) * 100;
    }
  }

  updateCharts(row: SimulationRow) {
    // Update line chart with confidence and pass rate
    const labels = this.lineChartData.labels as string[];
    const confidenceData = this.lineChartData.datasets[0].data as number[];
    const passRateData = this.lineChartData.datasets[1].data as number[];
    
    // Add new data point
    labels.push(`${row.rowIndex + 1}`);
    confidenceData.push((row.confidence || 0) * 100); // Convert to percentage
    
    // Calculate running pass rate
    const currentPassRate = this.processedRowsCount > 0 ? (this.passCount / this.processedRowsCount) * 100 : 0;
    passRateData.push(currentPassRate);
    
    // Keep only last 20 data points for better visibility
    if (labels.length > 20) {
      labels.shift();
      confidenceData.shift();
      passRateData.shift();
    }
    
    // Force chart update by creating new object
    this.lineChartData = {
      labels: [...labels],
      datasets: [{
        label: 'Confidence %',
        data: [...confidenceData],
        borderColor: '#3f51b5',
        backgroundColor: 'rgba(63, 81, 181, 0.1)',
        fill: false,
        tension: 0.4
      }, {
        label: 'Pass Rate %',
        data: [...passRateData],
        borderColor: '#4caf50',
        backgroundColor: 'rgba(76, 175, 80, 0.1)',
        fill: false,
        tension: 0.4
      }]
    };
    
    // Update donut chart
    this.donutChartData = {
      labels: ['Pass', 'Fail'],
      datasets: [{
        data: [this.passCount, this.failCount],
        backgroundColor: ['#4caf50', '#f44336'],
        borderWidth: 0
      }]
    };
  }

  updateRecentRows(row: SimulationRow) {
    this.recentRows.unshift(row);
    if (this.recentRows.length > 10) {
      this.recentRows.pop();
    }
  }

  completeSimulation() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.isRunning = false;
    this.isCompleted = true;
  }

  stopSimulation() {
    if (this.intervalId) {
      clearInterval(this.intervalId);
    }
    this.isRunning = false;
  }

  restartSimulation() {
    this.isCompleted = false;
    this.runSimulation();
  }

  goBack() {
    this.router.navigate(['/training', this.datasetId]);
  }

  goToStart() {
    this.router.navigate(['/upload']);
  }

  formatTime(timestamp: Date | string): string {
    const date = new Date(timestamp);
    return date.toLocaleTimeString();
  }

  getPredictionClass(prediction: number | undefined): string {
    return prediction === 1 ? 'prediction-pass' : 'prediction-fail';
  }
}
