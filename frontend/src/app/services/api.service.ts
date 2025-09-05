import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';
import { 
  Dataset, 
  DateRangeRequest, 
  DateRangeResponse, 
  TrainingResponse, 
  SimulationRow, 
  SimulationResponse 
} from '../models/dataset.model';

@Injectable({
  providedIn: 'root'
})
export class ApiService {
  private readonly apiUrl = 'http://localhost:5000/api';

  constructor(private http: HttpClient) {}

  uploadDataset(file: File): Observable<Dataset> {
    const formData = new FormData();
    formData.append('file', file);
    return this.http.post<Dataset>(`${this.apiUrl}/dataset/upload`, formData);
  }

  validateDateRanges(request: DateRangeRequest): Observable<DateRangeResponse> {
    return this.http.post<DateRangeResponse>(`${this.apiUrl}/dataset/validate-dates`, request);
  }

  trainModel(datasetId: number): Observable<TrainingResponse> {
    return this.http.post<TrainingResponse>(`${this.apiUrl}/dataset/train/${datasetId}`, {});
  }

  getSimulationData(datasetId: number): Observable<SimulationRow[]> {
    return this.http.get<SimulationRow[]>(`${this.apiUrl}/dataset/simulation/${datasetId}`);
  }

  simulateStep(datasetId: number, row: SimulationRow): Observable<SimulationResponse> {
    return this.http.post<SimulationResponse>(`${this.apiUrl}/dataset/simulate/${datasetId}`, row);
  }

  getDataset(datasetId: number): Observable<Dataset> {
    return this.http.get<Dataset>(`${this.apiUrl}/dataset/${datasetId}`);
  }
}
