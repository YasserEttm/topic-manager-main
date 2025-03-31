import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TopicService } from 'src/app/services/topic.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ModalController, PopoverController, ToastController } from '@ionic/angular';
import { CreatePostModal } from '../modals/create-post/create-post.component';
import { Post } from 'src/app/models/post';
import { addIcons } from 'ionicons';
import { addOutline, chevronForward, ellipsisVertical } from 'ionicons/icons';
import { ItemManagementPopover } from '../popover/item-management/item-management.component';
import { BehaviorSubject, switchMap } from 'rxjs';

addIcons({ addOutline, chevronForward, ellipsisVertical });

@Component({
  selector: 'app-topic-details',
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-breadcrumbs>
          <ion-breadcrumb routerLink="">Topics</ion-breadcrumb>
          <ion-breadcrumb [routerLink]="'#topics/' + (topic$ | async)?.id">
            {{ (topic$ | async)?.name }}
          </ion-breadcrumb>
        </ion-breadcrumbs>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">{{ (topic$ | async)?.name }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-list *ngIf="(topic$ | async)?.posts?.length; else noDataTemplate">
        @for(post of (topic$ | async)?.posts; track post.id) {
        <ion-item>
          <ion-button slot="start" (click)="presentPostManagementPopover($event, post)">
            <ion-icon name="ellipsis-vertical" color="medium"></ion-icon>
          </ion-button>

          <ion-thumbnail slot="start" *ngIf="post.imageUrl">
            <img [src]="post.imageUrl" alt="Post image" (error)="handleImageError($event)">
          </ion-thumbnail>

          <ion-label>{{ post.name }}</ion-label>
        </ion-item>
        }
      </ion-list>

      <!-- No Data State -->
      <ng-template #noDataTemplate>
        <div class="no-data-container">
          <img src="assets/img/no_data.svg" alt="No data" class="empty-state-image">
          <p>No posts yet. Create your first post!</p>
        </div>
      </ng-template>

      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button (click)="openCreatePostModal()">
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: [`
    ion-thumbnail {
      --size: 60px;
      --border-radius: 8px;
      margin-right: 12px;
    }
    ion-thumbnail img {
      object-fit: cover;
      width: 100%;
      height: 100%;
    }
    .no-data-container {
      display: flex;
      flex-direction: column;
      justify-content: center;
      align-items: center;
      height: 50vh;
      text-align: center;
      color: var(--ion-color-medium);
    }
    .empty-state-image {
      max-height: 180px;
      margin-bottom: 10px;
    }
  `],

  standalone: true,
  imports: [CommonModule, IonicModule, CommonModule, FormsModule, RouterLink],
})
export class TopicDetailsPage implements OnInit {
  private readonly topicService = inject(TopicService);
  private readonly route = inject(ActivatedRoute);
  private readonly modalCtrl = inject(ModalController);
  private readonly popoverCtrl = inject(PopoverController);
  private readonly toastCtrl = inject(ToastController);

  topicId = this.route.snapshot.params['id'];

  // BehaviorSubject to trigger data refresh
  private refreshTrigger = new BehaviorSubject<void>(undefined);

  // Topic Observable (auto-refreshes when refreshTrigger emits)
  topic$ = this.refreshTrigger.pipe(
    switchMap(() => this.topicService.getById(this.topicId))
  );

  ngOnInit() {
    this.refreshTopicData();
  }

  refreshTopicData() {
    this.refreshTrigger.next(); // This will trigger a refresh of topic$
  }

  handleImageError(event: Event) {
    const img = event.target as HTMLImageElement;
    img.style.display = 'none';
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
    const popover = await this.popoverCtrl.create({
      component: ItemManagementPopover,
      event,
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
