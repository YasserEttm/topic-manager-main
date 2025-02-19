import { Routes } from '@angular/router';

export const routes: Routes = [
  {
    path: 'topics',
    loadComponent: () =>
      import('./topics/topics.page').then((m) => m.TopicsPage),
  },
  {
    path: 'topics/:id',
    loadComponent: () =>
      import('./topics/topic-details/topic-details.page').then(
        (m) => m.TopicDetailsPage
      ),
  },
  {
    path: '',
    redirectTo: 'topics',
    pathMatch: 'full',
  },
];
