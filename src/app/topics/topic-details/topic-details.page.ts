import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule, Platform } from '@ionic/angular';
import { TopicService } from 'src/app/services/topic.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ModalController, PopoverController, ToastController } from '@ionic/angular';
import { CreatePostModal } from '../modals/create-post/create-post.component';
import { Post } from 'src/app/models/post';
import { addIcons } from 'ionicons';
import { addOutline, chevronForward, ellipsisVertical, imageOutline, locationOutline } from 'ionicons/icons';
import { ItemManagementPopover } from '../popover/item-management/item-management.component';
import { BehaviorSubject, switchMap } from 'rxjs';

addIcons({ addOutline, chevronForward, ellipsisVertical, imageOutline, locationOutline });

@Component({
  selector: 'app-topic-details',
  template: `
<ion-header [translucent]="true" class="safe-area-header">
    <ion-toolbar>
      <ion-buttons slot="start">
        <ion-back-button defaultHref="/topics"></ion-back-button>
      </ion-buttons>
      <ion-title>{{ (topic$ | async)?.name }}</ion-title>
    </ion-toolbar>
  </ion-header>

  <ion-content [fullscreen]="true">
    <ion-refresher slot="fixed" (ionRefresh)="refreshData($event)">
      <ion-refresher-content></ion-refresher-content>
    </ion-refresher>

    <!-- Desktop/Tablet View -->
    <ion-list *ngIf="(topic$ | async)?.posts?.length && !isMobileView" class="posts-list desktop-list">
      @for(post of (topic$ | async)?.posts; track post.id) {
      <ion-item class="post-item" [routerLink]="['/topics', topicId, 'posts', post.id]">
        <ion-thumbnail slot="start" *ngIf="post.imageUrl">
          <img [src]="post.imageUrl" alt="Post image" (error)="handleImageError($event)">
        </ion-thumbnail>
        <ion-thumbnail slot="start" *ngIf="!post.imageUrl">
          <div class="placeholder-image">
            <ion-icon name="image-outline"></ion-icon>
          </div>
        </ion-thumbnail>
        <ion-label>
          <h2>{{ post.name }}</h2>
          <p *ngIf="post.description">{{ post.description }}</p>
        </ion-label>
        <ion-icon name="chevron-forward" slot="end"></ion-icon>
        <ion-icon name="ellipsis-vertical" slot="end" (click)="presentPostManagementPopover($event, post)" class="action-icon"></ion-icon>
      </ion-item>
      }
    </ion-list>

    <!-- Mobile Optimized View -->
    <ion-list *ngIf="(topic$ | async)?.posts?.length && isMobileView" class="posts-list mobile-list">
      @for(post of (topic$ | async)?.posts; track post.id) {
      <ion-item class="post-item mobile-item" [routerLink]="['/topics', topicId, 'posts', post.id]">
        <ion-icon name="location-outline" color="primary" slot="start" class="location-icon"></ion-icon>
        <ion-label>
          <h2>{{ post.name }}</h2>
        </ion-label>
        <ion-buttons slot="end">
          <ion-button fill="clear" (click)="presentPostManagementPopover($event, post)">
            <ion-icon name="ellipsis-vertical" slot="icon-only"></ion-icon>
          </ion-button>
        </ion-buttons>
      </ion-item>
      }
    </ion-list>

    <!-- No Data State -->
    <div *ngIf="!(topic$ | async)?.posts?.length" class="no-data-container">
      <img src="assets/img/no_data.svg" alt="No data" class="empty-state-image">
      <p>No posts yet. Create your first post!</p>
      <ion-button (click)="openCreatePostModal()" fill="outline">
        <ion-icon name="add-outline" slot="start"></ion-icon>
        Create Post
      </ion-button>
    </div>

    <ion-fab slot="fixed" vertical="bottom" horizontal="end">
      <ion-fab-button (click)="openCreatePostModal()">
        <ion-icon name="add-outline"></ion-icon>
      </ion-fab-button>
    </ion-fab>
  </ion-content>
`,
  styleUrls: ['../modals/topics.scss'],
  standalone: true,
  imports: [CommonModule, IonicModule, CommonModule, FormsModule, RouterLink],
})
export class TopicDetailsPage implements OnInit {
  private readonly topicService = inject(TopicService);
  private readonly route = inject(ActivatedRoute);
  private readonly modalCtrl = inject(ModalController);
  private readonly popoverCtrl = inject(PopoverController);
  private readonly toastCtrl = inject(ToastController);
  private readonly platform = inject(Platform);

  topicId = this.route.snapshot.params['id'];
  isMobileView = false;

  // BehaviorSubject to trigger data refresh
  private refreshTrigger = new BehaviorSubject<void>(undefined);

  // Topic Observable (auto-refreshes when refreshTrigger emits)
  topic$ = this.refreshTrigger.pipe(
    switchMap(() => this.topicService.getById(this.topicId))
  );

  ngOnInit() {
    this.checkPlatform();
    this.refreshTopicData();

    // Watch for platform width changes
    this.platform.resize.subscribe(() => {
      this.checkPlatform();
    });
  }

  checkPlatform() {
    // Check if mobile based on screen width rather than user agent for more reliability
    this.isMobileView = this.platform.width() < 768;
  }

  refreshTopicData() {
    this.refreshTrigger.next(); // This will trigger a refresh of topic$
  }

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
  }

  refreshData(event: any) {
    this.refreshTopicData();
    setTimeout(() => {
      event.target.complete();
    }, 1000);
  }

  async openCreatePostModal(): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: CreatePostModal,
      componentProps: { topicId: this.topicId }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data === true) {
      this.refreshTopicData();
    }
  }

  async openEditPostModal(post: Post): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: CreatePostModal,
      componentProps: { topicId: this.topicId, post }
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data === true) {
      this.refreshTopicData();
    }
  }

  async presentPostManagementPopover(event: Event, post: Post) {
    // Prevent navigation when clicking the menu
    event.stopPropagation();
    event.preventDefault();

    const popover = await this.popoverCtrl.create({
      component: ItemManagementPopover,
      event,
      cssClass: 'post-management-popover'
    });

    await popover.present();

    const { data } = await popover.onDidDismiss();

    if (data?.action === 'remove') {
      this.topicService.removeTopic(this.topicId).subscribe({
        next: async () => {
          await this.showToast(`Topic deleted successfully`, 'success');
          this.refreshTopicData();
        },
        error: async (err) => {
          console.error('Failed to remove topic:', err);
          await this.showToast('Failed to delete topic', 'danger');
        },
      });
    } else if (data?.action === 'edit') {
      this.openEditPostModal(post);
    }
  }

  async showToast(message: string, color: 'success' | 'danger' = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      color,
      cssClass: 'custom-toast'
    });
    await toast.present();
  }
}
