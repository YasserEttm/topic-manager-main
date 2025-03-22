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

addIcons({ addOutline, chevronForward, ellipsisVertical });

@Component({
  selector: 'app-topic-details',
  template: `
    <ion-header [translucent]="true">
      <ion-toolbar>
        <ion-breadcrumbs>
          <ion-breadcrumb routerLink="">Topics</ion-breadcrumb>
          <ion-breadcrumb [routerLink]="'#topics/' + topic()?.id">{{
            topic()?.name
          }}</ion-breadcrumb>
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
          <ion-button
            slot="start"
            fill="clear"
            id="click-trigger"
            (click)="presentPostManagementPopover($event, post)"
            aria-label="open post management popover"
            data-cy="open-post-management-popover"
            ><ion-icon
              slot="icon-only"
              color="medium"
              name="ellipsis-vertical"
            ></ion-icon
          ></ion-button>
          <ion-label>{{ post.name }}</ion-label>
        </ion-item>

        } @empty {
        <ion-img
          class="image"
          src="assets/img/no_data.svg"
          alt="No data"
        ></ion-img>
        }
      </ion-list>
      <ion-fab slot="fixed" vertical="bottom" horizontal="end">
        <ion-fab-button
          data-cy="open-create-post-modal-button"
          aria-label="open add post modal"
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
  standalone: true,
  imports: [IonicModule, CommonModule, FormsModule, RouterLink],
})
export class TopicDetailsPage {
  private readonly topicService = inject(TopicService);
  private readonly route = inject(ActivatedRoute);
  private readonly modalCtrl = inject(ModalController);
  private readonly popoverCtrl = inject(PopoverController);

  topicId = this.route.snapshot.params['id'];

  topic = toSignal(this.topicService.getById(this.topicId));

  async openModal(post?: Post): Promise<void> {
    const modal = await this.modalCtrl.create({
      component: CreatePostModal,
      componentProps: { topicId: this.topicId, post },
    });
    modal.present();

    await modal.onDidDismiss();
  }

  async presentPostManagementPopover(event: Event, post: Post) {
    const popover = await this.popoverCtrl.create({
      component: ItemManagementPopover,
      event,
    });

    await popover.present();

    const {
      data: { action },
    } = await popover.onDidDismiss();

    console.log(action);

    if (action === 'remove') {
      this.topicService.removePost(this.topicId, post).subscribe({
        next: () => {
          console.log('Post removed successfully');
          // Mettre à jour la liste des posts après suppression
          this.topic = toSignal(this.topicService.getById(this.topicId));
        },
        error: (err) => {
          console.error('Failed to remove post:', err);
        },
      });
    } else if (action === 'edit') {
      this.openModal(post);
    }
  }
}
