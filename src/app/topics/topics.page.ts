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

  topics = toSignal(this.topicService.getAll());

  async openModal(topic?: Topic): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: CreateTopicModal,
      componentProps: { topic },
    });
    modal.present();

    await modal.onDidDismiss();
  }

  async presentTopicManagementPopover(event: Event, topic: Topic) {
    const popover = await this.popoverCtrl.create({
      component: ItemManagementPopover,
      event,
    });

    await popover.present();

    const {
      data: { action },
    } = await popover.onDidDismiss();

    if (action === 'remove') this.topicService.removeTopic(topic.id);
    else if (action === 'edit') this.openModal(topic);
  }
}
