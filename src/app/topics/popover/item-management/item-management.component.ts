import { Component, inject } from '@angular/core';
import { ReactiveFormsModule } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { PopoverController } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { pencil, trash } from 'ionicons/icons';

addIcons({ trash, pencil });

@Component({
  selector: 'app-manage-item',
  imports: [IonicModule, ReactiveFormsModule],
  template: `
    <ion-content>
      <ion-list>
        <ion-item [button]="true" [detail]="false" (click)="edit()">
          <ion-label>Edit</ion-label>
          <ion-icon slot="end" name="pencil"></ion-icon>
        </ion-item>
        <ion-item [button]="true" [detail]="false">
          <ion-label color="danger" (click)="remove()">Delete</ion-label>
          <ion-icon color="danger" slot="end" name="trash"></ion-icon>
        </ion-item>
      </ion-list>
    </ion-content>
  `,
})
export class ItemManagementPopover {
  private readonly popoverCtrl = inject(PopoverController);

  edit() {
    this.popoverCtrl.dismiss({ action: 'edit' });
  }

  remove() {
    this.popoverCtrl.dismiss({ action: 'remove' });
  }
}
