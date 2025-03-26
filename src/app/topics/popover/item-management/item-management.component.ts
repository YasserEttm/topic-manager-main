import { Component, inject } from '@angular/core';
import { PopoverController } from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { ReactiveFormsModule } from '@angular/forms';
import { addIcons } from 'ionicons';
import { pencil, trash, personAdd } from 'ionicons/icons';

addIcons({ trash, pencil, personAdd });

@Component({
  selector: 'app-manage-item',
  imports: [IonicModule, ReactiveFormsModule],
  template: `
    <ion-content>
      <ion-list>
        <ion-item button (click)="edit()">
          <ion-label>Edit</ion-label>
          <ion-icon slot="end" name="pencil"></ion-icon>
        </ion-item>
        <ion-item button (click)="remove()">
          <ion-label color="danger">Delete</ion-label>
          <ion-icon color="danger" slot="end" name="trash"></ion-icon>
        </ion-item>
        <ion-item button (click)="addReaders()">
          <ion-label>Add Readers</ion-label>
          <ion-icon slot="end" name="person-add"></ion-icon>
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

  addReaders() {
    this.popoverCtrl.dismiss({ action: 'addReaders' });
  }
}
