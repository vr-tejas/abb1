import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: '',
    loadComponent: () => import('./components/upload/upload.component').then(m => m.UploadComponent)
  },
  {
    path: 'upload',
    loadComponent: () => import('./components/upload/upload.component').then(m => m.UploadComponent)
  },
  {
    path: 'date-ranges/:id',
    loadComponent: () => import('./components/date-ranges/date-ranges.component').then(m => m.DateRangesComponent)
  },
  {
    path: 'training/:id',
    loadComponent: () => import('./components/training/training.component').then(m => m.TrainingComponent)
  },
  {
    path: 'simulation/:id',
    loadComponent: () => import('./components/simulation/simulation.component').then(m => m.SimulationComponent)
  },
  {
    path: '**',
    redirectTo: '/upload'
  }
];
