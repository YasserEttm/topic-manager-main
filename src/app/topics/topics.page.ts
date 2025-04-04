import { Component, inject, HostListener } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TopicService } from '../services/topic.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import {
  addOutline,
  chevronForward,
  ellipsisVertical,
  bookOutline,
  pencilOutline
} from 'ionicons/icons';
import {
  ModalController,
  PopoverController,
  ToastController,
  Platform
} from '@ionic/angular/standalone';
import { CreateTopicModal } from './modals/create-topic/create-topic.component';
import { ItemManagementPopover } from './popover/item-management/item-management.component';
import { Topic } from '../models/topic';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavbarComponent } from '../shared/navbar/navbar.component';
import { AddReaderModal } from './modals/add-reader-modal/add-reader-modal.component';
import { AddWriterModal } from './modals/add-writer-modal/add-writer-modal.component';

addIcons({ addOutline, chevronForward, ellipsisVertical, bookOutline, pencilOutline });

@Component({
  selector: 'app-home',
  template: `
<app-navbar [pageTitle]="'Topics'"></app-navbar>

<ion-content [fullscreen]="true">
  <ion-list>
    <!-- My Topics -->
    <ion-list-header>My Topics</ion-list-header>

    <ng-container *ngFor="let topic of topics()">
      <ng-container *ngIf="topic.isOwner">
        <ion-item lines="none" class="topic-item" [routerLink]="['/topics/' + topic.id]">

          <!-- Desktop View -->
          <ng-container *ngIf="!isMobile">
            <ion-grid>
              <ion-row class="ion-align-items-center">
                <ion-col class="ion-no-padding topic-name">
                  <ion-label>{{ topic.name }}</ion-label>
                </ion-col>

                <ion-col size="auto" class="post-count">
                  <ion-note>{{ topic.posts.length }}</ion-note>
                </ion-col>

                <ion-col size="auto">
                  <ion-button
                    fill="clear"
                    *ngIf="topic.isWriter || topic.isOwner"
                    (click)="presentTopicManagementPopover($event, topic); $event.stopPropagation();"
                    class="menu-button"
                    aria-label="open topic management popover"
                  >
                    <ion-icon slot="icon-only" color="medium" name="ellipsis-vertical"></ion-icon>
                  </ion-button>
                </ion-col>

                <ion-col size="auto" class="forward-icon">
                  <ion-icon color="medium" name="chevron-forward"></ion-icon>
                </ion-col>
              </ion-row>
            </ion-grid>
          </ng-container>

          <!-- Mobile View -->
          <ng-container *ngIf="isMobile">
            <div class="topic-row-mobile">
              <div class="topic-name-mobile">{{ topic.name }}</div>

              <div class="topic-actions-mobile">
                <ion-note class="post-count">{{ topic.posts.length }}</ion-note>

                <ion-button
                  fill="clear"
                  *ngIf="topic.isWriter || topic.isOwner"
                  (click)="presentTopicManagementPopover($event, topic); $event.stopPropagation();"
                  class="menu-button"
                  aria-label="open topic management popover"
                >
                  <ion-icon slot="icon-only" color="medium" name="ellipsis-vertical"></ion-icon>
                </ion-button>

                <ion-icon color="medium" name="chevron-forward" class="forward-icon"></ion-icon>
              </div>
            </div>
          </ng-container>

        </ion-item>
      </ng-container>
    </ng-container>

    <!-- Shared with Me -->
    <ion-list-header class="shared-header">Shared with Me</ion-list-header>

    <ng-container *ngFor="let topic of topics()">
      <ng-container *ngIf="!topic.isOwner && (topic.isReader || topic.isWriter)">
        <ion-item lines="none" class="topic-item shared-item" [routerLink]="['/topics/' + topic.id]">

          <!-- Desktop View -->
          <ng-container *ngIf="!isMobile">
            <ion-grid>
              <ion-row class="ion-align-items-center">
                <ion-col class="ion-no-padding topic-name">
                  <ion-label>{{ topic.name }}</ion-label>
                </ion-col>

                <ion-col size="auto" class="role-indicator">
                  <ion-badge color="primary">
                    {{ topic.isReader ? 'Reader' : '' }}{{ topic.isWriter ? 'Writer' : '' }}
                  </ion-badge>
                </ion-col>

                <ion-col size="auto" class="post-count">
                  <ion-note>{{ topic.posts.length }}</ion-note>
                </ion-col>

                <ion-col size="auto" *ngIf="topic.isWriter">
                  <ion-button
                    fill="clear"
                    (click)="presentTopicManagementPopover($event, topic); $event.stopPropagation();"
                    class="menu-button"
                    aria-label="open topic management popover"
                  >
                    <ion-icon slot="icon-only" color="medium" name="ellipsis-vertical"></ion-icon>
                  </ion-button>
                </ion-col>

                <ion-col size="auto" class="forward-icon">
                  <ion-icon color="medium" name="chevron-forward"></ion-icon>
                </ion-col>
              </ion-row>
            </ion-grid>
          </ng-container>

          <!-- Mobile View -->
          <ng-container *ngIf="isMobile">
            <div class="topic-row-mobile">
              <div class="topic-name-mobile">
                {{ topic.name }}
                <ion-icon *ngIf="topic.isReader" name="book-outline" color="primary" class="role-icon"></ion-icon>
                <ion-icon *ngIf="topic.isWriter" name="pencil-outline" color="primary" class="role-icon"></ion-icon>
              </div>

              <div class="topic-actions-mobile">
                <ion-note class="post-count">{{ topic.posts.length }}</ion-note>

                <ion-button
                  fill="clear"
                  *ngIf="topic.isWriter"
                  (click)="presentTopicManagementPopover($event, topic); $event.stopPropagation();"
                  class="menu-button"
                  aria-label="open topic management popover"
                >
                  <ion-icon slot="icon-only" color="medium" name="ellipsis-vertical"></ion-icon>
                </ion-button>

                <ion-icon color="medium" name="chevron-forward" class="forward-icon"></ion-icon>
              </div>
            </div>
          </ng-container>

        </ion-item>
      </ng-container>
    </ng-container>

    <!-- No Data -->
    <ng-container *ngIf="topics()?.length === 0">
      <ion-img class="image" src="assets/img/no_data.svg" alt="No topics found."></ion-img>
    </ng-container>
  </ion-list>

  <!-- FAB Add Button -->
  <ion-fab slot="fixed" vertical="bottom" horizontal="end" class="mobile-fab">
    <ion-fab-button
      data-cy="open-create-topic-modal-button"
      aria-label="open add topic modal"
      (click)="openModal()"
      class="round-fab"
    >
      <ion-icon name="add-outline"></ion-icon>
    </ion-fab-button>
  </ion-fab>
</ion-content>


  `,
  styleUrls: ['../topics/modals/topics.scss'],
  imports: [IonicModule, CommonModule, RouterLink, NavbarComponent],
})
export class TopicsPage {
  private readonly topicService = inject(TopicService);
  private readonly modalCtrl = inject(ModalController);
  private readonly popoverCtrl = inject(PopoverController);
  private readonly toastCtrl = inject(ToastController);
  private readonly platform = inject(Platform);

  topics = toSignal(this.topicService.getAll());
  isMobile = false;

  constructor() {
    this.checkScreenSize();
  }

  @HostListener('window:resize')
  checkScreenSize() {
    this.isMobile = this.platform.is('mobile') || this.platform.width() < 576;
  }

  trackTopicId(index: number, topic: Topic): number {
    return +topic.id;
  }

  async openModal(topic?: Topic): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: CreateTopicModal,
      componentProps: { topic },
    });
    modal.present();
    await modal.onDidDismiss();
  }

  async openAddReaderModal(topic: Topic) {
    const modal = await this.modalCtrl.create({
      component: AddReaderModal,
      componentProps: { topicId: topic.id },
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data?.email) {
      this.topicService.addReader(topic.id, data.email);
    }
  }

  async openAddWriterModal(topic: Topic) {
    const modal = await this.modalCtrl.create({
      component: AddWriterModal,
      componentProps: { topicId: topic.id },
    });

    await modal.present();

    const { data } = await modal.onDidDismiss();
    if (data?.email) {
      this.topicService.addWriter(topic.id, data.email);
    }
  }

  async presentTopicManagementPopover(event: Event, topic: Topic) {
    event.preventDefault();
    event.stopPropagation();

    const popover = await this.popoverCtrl.create({
      component: ItemManagementPopover,
      event,
      componentProps: {
        isOwner: topic.isOwner,
        isWriter: topic.isWriter,
        isReader: topic.isReader,
      },
    });

    await popover.present();

    const { data } = await popover.onDidDismiss();
    if (!data) return;

    if (data.action === 'remove' && topic.isOwner) {
      this.topicService.removeTopic(topic.id).subscribe({
        next: async () => {
          await this.showToast(`Topic "${topic.name}" deleted successfully`, 'success');
        },
        error: async (err) => {
          console.error('Failed to remove topic:', err);
          await this.showToast('Failed to delete topic', 'danger');
        },
      });
    } else if (data.action === 'edit' && (topic.isOwner || topic.isWriter)) {
      this.openModal(topic);
    } else if (data.action === 'addReaders') {
      this.openAddReaderModal(topic);
    } else if (data.action === 'addWriters') {
      this.openAddWriterModal(topic);
    }
  }

  async showToast(message: string, color: 'success' | 'danger' = 'success') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 3000,
      position: 'top',
      color,
      cssClass: 'custom-toast',
    });
    await toast.present();
  }
}
