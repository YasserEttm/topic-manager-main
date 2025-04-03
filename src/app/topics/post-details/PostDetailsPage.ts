import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ActivatedRoute, RouterLink, Router } from '@angular/router';
import { IonicModule, Platform } from '@ionic/angular';
import { TopicService } from '../../services/topic.service';
import { switchMap, of, catchError, tap } from 'rxjs';
import { Post } from 'src/app/models/post';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AzureStorageService } from 'src/app/services/azure-storage.service';
import { addIcons } from 'ionicons';
import { locationOutline, calendarOutline, imageOutline } from 'ionicons/icons';
import { NavbarComponent } from "../../shared/navbar/navbar.component";


addIcons({ locationOutline, calendarOutline, imageOutline });

@Component({
  selector: 'app-post-details',
  standalone: true,
  imports: [CommonModule, IonicModule, RouterLink, NavbarComponent],
  template: `
     <app-navbar [pageTitle]="post?.name || 'Post Details'"></app-navbar>
      <ion-content [fullscreen]="true">
        <ion-refresher slot="fixed" (ionRefresh)="refreshPost($event)">
          <ion-refresher-content></ion-refresher-content>
        </ion-refresher>

        <div class="post-detail-container" *ngIf="post">
          <div class="post-image" *ngIf="postImageSafe">
            <img [src]="postImageSafe" alt="{{ post.name }}">
          </div>
          <div class="post-image" *ngIf="!postImageSafe">
            <div class="placeholder-image">
              <ion-icon name="image-outline" size="large"></ion-icon>
            </div>
          </div>

          <div class="post-content">
            <div class="travel-label">
              <ion-icon name="location-outline"></ion-icon>
              {{ topicName }}
            </div>
            <h1>{{ post.name }}</h1>
            <p *ngIf="post.description">{{ post.description }}</p>
            <p *ngIf="!post.description" class="no-description">No description available for this destination.</p>
          </div>
        </div>

        <div class="no-data-container" *ngIf="!post">
          <img src="assets/img/no_data.svg" alt="Not Found" class="empty-state-image">
          <p>Post not found.</p>
          <ion-button [routerLink]="['/topics', topicId]" fill="outline">
            Return to Topic
          </ion-button>
        </div>
      </ion-content>
  `,
  styleUrls: ['../modals/topics.scss']
})
export class PostDetailsPage implements OnInit {
  private readonly route = inject(ActivatedRoute);
  private readonly router = inject(Router);
  private readonly topicService = inject(TopicService);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly azureStorage = inject(AzureStorageService);
  private readonly platform = inject(Platform);

  post: Post | undefined;
  postImageSafe: SafeUrl | null = null;
  topicId: string = '';
  topicName: string = 'Destination'; // Default value
  isMobileView = false;

  ngOnInit(): void {
    this.checkPlatform();
    this.loadPostData();

    // Watch for platform width changes
    this.platform.resize.subscribe(() => {
      this.checkPlatform();
    });
  }

  checkPlatform() {
    // Check if mobile based on screen width rather than user agent
    this.isMobileView = this.platform.width() < 768;
  }

  loadPostData(): void {
    this.route.params
      .pipe(
        switchMap((params) => {
          this.topicId = params['topicId'];
          const postId = params['postId'];

          // First get the topic to get its name
          return this.topicService.getById(this.topicId).pipe(
            tap(topic => {
              if (topic) {
                this.topicName = topic.name;
              }
            }),
            // Then get the post
            switchMap(() => this.topicService.getPostById(this.topicId, postId).pipe(
              catchError(err => {
                console.error('Error loading post:', err);
                return of(undefined);
              })
            ))
          );
        })
      )
      .subscribe(async (post) => {
        this.post = post;

        // Load image if available
        if (post?.imageUrl) {
          try {
            this.postImageSafe = await this.azureStorage.getImageUrl(post.imageUrl);
          } catch (error) {
            console.error('Error loading image:', error);
            this.postImageSafe = null;
          }
        }
      });
  }

  refreshPost(event: any): void {
    this.loadPostData();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }
}
