import { Component, computed, inject, signal } from '@angular/core';
import { IonicModule } from '@ionic/angular';
import { TopicService } from '../services/topic.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { addOutline, chevronForward, ellipsisVertical } from 'ionicons/icons';
import { ModalController } from '@ionic/angular/standalone';
import { PopoverController } from '@ionic/angular/standalone';
import { CreateTopicModal } from './modals/create-topic/create-topic.component';
import { ItemManagementPopover } from './popover/item-management/item-management.component';
import { Topic } from '../models/topic';
import { toSignal } from '@angular/core/rxjs-interop';
import { NavbarComponent } from "../shared/navbar/navbar.component";
import { ToastController } from '@ionic/angular';
import { AddReaderModal } from './modals/add-reader-modal/add-reader-modal.component';


addIcons({ addOutline, chevronForward, ellipsisVertical });

@Component({
  selector: 'app-home',
  template: `
    <app-navbar [pageTitle]="'Topics'"></app-navbar>
    <ion-content [fullscreen]="true">
      <ion-list>
        @for(topic of topics(); track topic.id) {
        <ion-item>
          <ion-button
            slot="start"
            fill="clear"
            id="click-trigger"
            (click)="presentTopicManagementPopover($event, topic)"
            aria-label="open topic management popover"
            data-cy="open-topic-management-popover"
            ><ion-icon
              slot="icon-only"
              color="medium"
              name="ellipsis-vertical"
            ></ion-icon
          ></ion-button>

          <ion-label [routerLink]="['/topics/' + topic.id]">{{
            topic.name
          }}</ion-label>
          <ion-note slot="end">{{ topic.posts.length }}</ion-note>
          <ion-icon
            slot="end"
            [routerLink]="['/topics/' + topic.id]"
            color="medium"
            name="chevron-forward"
          ></ion-icon>
        </ion-item>
        } @empty {
        <ion-img class="image" src="assets/img/no_data.svg" alt=""></ion-img>
        }
      </ion-list>
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

  async openModal(topic?: Topic): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: CreateTopicModal,
      componentProps: { topic },
    });
    modal.present();

    await modal.onDidDismiss();
  }

  async presentToast(message: string, color: 'success' | 'danger') {
    const toast = await this.toastCtrl.create({
      message,
      duration: 2000,
      color,
    });
    await toast.present();
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
  
  
  async presentTopicManagementPopover(event: Event, topic: Topic) {
    const popover = await this.popoverCtrl.create({
      component: ItemManagementPopover,
      event,
    });
  
    await popover.present();
  
    const { data } = await popover.onDidDismiss();
    if (!data) return;
  
    if (data.action === 'remove') {
      this.topicService.removeTopic(topic.id).subscribe({
        next: async () => {
          await this.showToast(`Topic "${topic.name}" deleted successfully`, 'success');
          // Add any UI refresh logic if needed
        },
        error: async (err) => {
          console.error('Failed to remove topic:', err);
          await this.showToast('Failed to delete topic', 'danger');
        },
      });
    } else if (data.action === 'edit') {
      this.openModal(topic);
    } else if (data.action === 'addReaders') {
      this.openAddReaderModal(topic);
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
