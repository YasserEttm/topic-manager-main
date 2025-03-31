import { Component, inject, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TopicService } from 'src/app/services/topic.service';
import { ActivatedRoute, RouterLink } from '@angular/router';
import { ModalController } from '@ionic/angular/standalone';
import { PopoverController } from '@ionic/angular/standalone';
import { CreatePostModal } from '../modals/create-post/create-post.component';
import { Post } from 'src/app/models/post';
import { addIcons } from 'ionicons';
import { addOutline, chevronForward, ellipsisVertical } from 'ionicons/icons';
import { ItemManagementPopover } from '../popover/item-management/item-management.component';
import { toSignal } from '@angular/core/rxjs-interop';
import { ToastController } from '@ionic/angular';

addIcons({ addOutline, chevronForward, ellipsisVertical });

@Component({
  selector: 'app-topic-details',
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-breadcrumbs>
          <ion-breadcrumb routerLink="">Topics</ion-breadcrumb>
          <ion-breadcrumb [routerLink]="'#topics/' + topic()?.id">
            {{ topic()?.name }}
          </ion-breadcrumb>
        </ion-breadcrumbs>
      </ion-toolbar>
    </ion-header>

    <ion-content [fullscreen]="true">
      <ion-header collapse="condense">
        <ion-toolbar>
          <ion-title size="large">{{ topic()?.name }}</ion-title>
        </ion-toolbar>
      </ion-header>

      <ion-list>
        @for(post of topic()?.posts; track post.id) {
        <ion-item>
          <ion-button slot="start" (click)="presentPostManagementPopover($event, post)">
            <ion-icon name="ellipsis-vertical" color="medium"></ion-icon>
          </ion-button>

          <!-- Afficher l'image du post si disponible -->
          <ion-thumbnail slot="start" *ngIf="post.imageUrl">
            <img [src]="post.imageUrl" alt="Post image" (error)="handleImageError($event)">
          </ion-thumbnail>

          <ion-label>{{ post.name }}</ion-label>
        </ion-item>
        } @empty {
        <ion-item lines="none" class="ion-text-center">
          <ion-label>
            <ion-img src="assets/img/no_data.svg" alt="No data" class="empty-state-image"></ion-img>
            <p>No posts yet. Create your first post!</p>
          </ion-label>
        </ion-item>
        }
      </ion-list>

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
    .empty-state-image {
      max-height: 200px;
      margin: 0 auto;
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
  topic = toSignal(this.topicService.getById(this.topicId));

  ngOnInit() {
    this.refreshTopicData();
  }

  refreshTopicData() {
    this.topic = toSignal(this.topicService.getById(this.topicId));
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

    if (data.action === 'remove') {
      this.topicService.removeTopic(this.topicId).subscribe({
        next: async () => {
          await this.showToast(`Topic "${this.topic.name}" deleted successfully`, 'success');
          // Add any UI refresh logic if needed
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
      position: 'top', // You can change it to 'bottom' or 'middle' if needed
      color, // Green for success, red for error
      cssClass: 'custom-toast' // Optional, for styling
    });
    await toast.present();
  }
}
