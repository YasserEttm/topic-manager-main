import { Component, inject } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TopicService } from '../services/topic.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { addOutline, chevronForward, ellipsisVertical } from 'ionicons/icons';
import {
  ModalController,
  PopoverController,
  ToastController,
} from '@ionic/angular/standalone';
import { CreateTopicModal } from './modals/create-topic/create-topic.component';
import { ItemManagementPopover } from './popover/item-management/item-management.component';
import { Topic } from '../models/topic';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavbarComponent } from '../shared/navbar/navbar.component';
import { AddReaderModal } from './modals/add-reader-modal/add-reader-modal.component';
import { AddWriterModal } from './modals/add-writer-modal/add-writer-modal.component';

addIcons({ addOutline, chevronForward, ellipsisVertical });

@Component({
  selector: 'app-home',
  template: `
    <app-navbar [pageTitle]="'Topics'"></app-navbar>
    <ion-content [fullscreen]="true">
      <ion-list>
        <!-- Display My Topics -->
        <ion-list-header>My Topics</ion-list-header>
        <ng-container *ngFor="let topic of topics()">
          <ng-container *ngIf="topic.isOwner">
            <ion-item lines="none">
              <ion-grid>
                <ion-row class="ion-align-items-center">
                  <!-- Reserve space for the button -->
                  <ion-col
                    size="auto"
                    [ngClass]="{
                      'button-visible': topic.isWriter || topic.isOwner
                    }"
                  >
                    <ion-button
                      fill="clear"
                      *ngIf="topic.isWriter || topic.isOwner"
                      (click)="presentTopicManagementPopover($event, topic)"
                      aria-label="open topic management popover"
                      data-cy="open-topic-management-popover"
                    >
                      <ion-icon
                        slot="icon-only"
                        color="medium"
                        name="ellipsis-vertical"
                      ></ion-icon>
                    </ion-button>
                    <!-- Invisible button reserve space -->
                    <ion-button
                      fill="clear"
                      *ngIf="!(topic.isWriter || topic.isOwner)"
                      style="visibility: hidden; height: 44px;"
                    >
                      <ion-icon
                        slot="icon-only"
                        color="medium"
                        name="ellipsis-vertical"
                      ></ion-icon>
                    </ion-button>
                  </ion-col>

                  <!-- Topic Name and Router Link -->
                  <ion-col class="ion-no-padding">
                    <ion-label [routerLink]="['/topics/' + topic.id]">
                      {{ topic.name }}
                    </ion-label>
                  </ion-col>

                  <!-- Post Count -->
                  <ion-col size="auto">
                    <ion-note>{{ topic.posts.length }}</ion-note>
                  </ion-col>

                  <!-- Forward Arrow -->
                  <ion-col size="auto">
                    <ion-icon
                      [routerLink]="['/topics/' + topic.id]"
                      color="medium"
                      name="chevron-forward"
                    ></ion-icon>
                  </ion-col>
                </ion-row>
              </ion-grid>
            </ion-item>
          </ng-container>
        </ng-container>

        <!-- Display Shared with Me -->
        <ion-list-header>Shared with Me</ion-list-header>
        <ng-container *ngFor="let topic of topics()">
          <ng-container
            *ngIf="!topic.isOwner && (topic.isReader || topic.isWriter)"
          >
            <ion-item lines="none">
              <ion-grid>
                <ion-row class="ion-align-items-center">
                  <!-- Reserve space for the button -->
                  <ion-col
                    size="auto"
                    [ngClass]="{ 'button-visible': topic.isWriter }"
                  >
                    <ion-button
                      fill="clear"
                      *ngIf="topic.isWriter"
                      (click)="presentTopicManagementPopover($event, topic)"
                      aria-label="open topic management popover"
                      data-cy="open-topic-management-popover"
                    >
                      <ion-icon
                        slot="icon-only"
                        color="medium"
                        name="ellipsis-vertical"
                      ></ion-icon>
                    </ion-button>
                    <!-- Invisible button reserve space -->
                    <ion-button
                      fill="clear"
                      *ngIf="!topic.isWriter"
                      style="visibility: hidden; height: 44px;"
                    >
                      <ion-icon
                        slot="icon-only"
                        color="medium"
                        name="ellipsis-vertical"
                      ></ion-icon>
                    </ion-button>
                  </ion-col>

                  <!-- Topic Name and Router Link -->
                  <ion-col class="ion-no-padding">
                    <ion-label [routerLink]="['/topics/' + topic.id]">
                      {{ topic.name }}
                    </ion-label>
                  </ion-col>

                  <!-- Access Badge (Reader/Writer) -->
                  <ion-col size="auto">
                    <ion-badge color="primary">
                      {{ topic.isReader ? 'Reader' : '' }}
                      {{ topic.isWriter ? 'Writer' : '' }}
                    </ion-badge>
                  </ion-col>

                  <!-- Post Count -->
                  <ion-col size="auto">
                    <ion-note>{{ topic.posts.length }}</ion-note>
                  </ion-col>

                  <!-- Forward Arrow -->
                  <ion-col size="auto">
                    <ion-icon
                      [routerLink]="['/topics/' + topic.id]"
                      color="medium"
                      name="chevron-forward"
                    ></ion-icon>
                  </ion-col>
                </ion-row>
              </ion-grid>
            </ion-item>
          </ng-container>
        </ng-container>

        <!-- Fallback message if no topics available -->
        <ng-container *ngIf="topics()?.length === 0">
          <ion-img class="image" src="assets/img/no_data.svg" alt=""></ion-img>
        </ng-container>
      </ion-list>

      <!-- Floating action button for creating topics -->
      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button
          data-cy="open-create-topic-modal-button"
          aria-label="open add topic modal"
          (click)="openModal()"
        >
          <ion-icon name="add-outline"></ion-icon>
        </ion-fab-button>
      </ion-fab>
    </ion-content>
  `,
  styles: [
    `
      .image::part(image) {
        width: 50%;
        margin: auto;
      }
    `,
  ],
  imports: [IonicModule, CommonModule, RouterLink, NavbarComponent],
})
export class TopicsPage {
  private readonly topicService = inject(TopicService);
  private readonly modalCtrl = inject(ModalController);
  private readonly popoverCtrl = inject(PopoverController);
  private readonly toastCtrl = inject(ToastController);

  topics = toSignal(this.topicService.getAll());

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
    const popover = await this.popoverCtrl.create({
      component: ItemManagementPopover,
      event,
      componentProps: {
        isOwner: topic.isOwner, // Pass the isOwner flag
        isWriter: topic.isWriter, // Pass the isWriter flag
        isReader: topic.isReader, // Pass the isReader flag
      },
    });

    await popover.present();

    const { data } = await popover.onDidDismiss();
    if (!data) return;

    // Handle actions based on the user's selection in the popover
    if (data.action === 'remove' && topic.isOwner) {
      // Only the owner can delete
      this.topicService.removeTopic(topic.id).subscribe({
        next: async () => {
          await this.showToast(
            `Topic "${topic.name}" deleted successfully`,
            'success'
          );
        },
        error: async (err) => {
          console.error('Failed to remove topic:', err);
          await this.showToast('Failed to delete topic', 'danger');
        },
      });
    } else if (data.action === 'edit' && (topic.isOwner || topic.isWriter)) {
      // Allow editing if the user is the owner or a writer
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
