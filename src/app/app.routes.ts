import { inject } from '@angular/core';
import { Router, Routes } from '@angular/router';
import { AuthService } from './services/auth.service';
import { map } from 'rxjs';

export const routes: Routes = [
 {
     canActivate: [
      () => {
        const _authService = inject (AuthService);
        const _router = inject (Router);
        return _authService.getConnectedUser().pipe(
          map(user => {
            if(!user) _router.navigateByUrl('/login');
            return !!user;
          }),
        )

      }
    ],
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

  {
    path: 'topics/:topicId/posts/:postId',
    loadComponent: () =>
      import('./topics/post-details/PostDetailsPage').then(
        (m) => m.PostDetailsPage
      ),
  },
  {
    path: 'login',
    loadComponent: () => import('./auth/login/login.page').then( m => m.LoginPage)
  },

  {
    path: 'register',
    loadComponent: () => import('./auth/register/register.component').then( m => m.RegisterComponent)
  },

  {
    path: '**',
    redirectTo: 'topics',
  }
];
