import { Component, inject, Input } from '@angular/core';
import { PopoverController } from '@ionic/angular/standalone';
import { IonicModule } from '@ionic/angular';
import { CommonModule } from '@angular/common';  // Import CommonModule
import { addIcons } from 'ionicons';
import { pencil, trash, personAdd } from 'ionicons/icons';

addIcons({ trash, pencil, personAdd });

@Component({
  selector: 'app-manage-item',
  imports: [IonicModule, CommonModule], // Include CommonModule here
  template: `
   <ion-content>
  <ion-list>
    <!-- Show 'Edit' if the user is the owner or writer -->
    <ion-item button *ngIf="isOwner || isWriter" (click)="edit()">
      <ion-label>Edit</ion-label>
      <ion-icon slot="end" name="pencil"></ion-icon>
    </ion-item>

    <!-- Show 'Delete' if the user is the owner -->
    <ion-item button *ngIf="isOwner" (click)="remove()">
      <ion-label color="danger">Delete</ion-label>
      <ion-icon slot="end" color="danger" name="trash"></ion-icon>
    </ion-item>

    <!-- Only show these if it's NOT a post -->
    <ng-container *ngIf="!forPost">
      <ion-item button *ngIf="isOwner" (click)="addReaders()">
        <ion-label>Add Readers</ion-label>
        <ion-icon slot="end" name="person-add"></ion-icon>
      </ion-item>

      <ion-item button *ngIf="isOwner" (click)="addWriters()">
        <ion-label>Add Writers</ion-label>
        <ion-icon slot="end" name="person-add"></ion-icon>
      </ion-item>
    </ng-container>
  </ion-list>
</ion-content>

  `,
})
export class ItemManagementPopover {
  private readonly popoverCtrl = inject(PopoverController);

  // Role flags passed as input
  isOwner: boolean = false;
  isWriter: boolean = false;
  isReader: boolean = false;
  @Input() forPost: boolean = false;

  // Method to trigger the "edit" action
  edit() {
    this.popoverCtrl.dismiss({ action: 'edit' });
  }

  // Method to trigger the "delete" action
  remove() {
    this.popoverCtrl.dismiss({ action: 'remove' });
  }

  // Method to trigger the "add readers" action
  addReaders() {
    this.popoverCtrl.dismiss({ action: 'addReaders' });
  }

  // Method to trigger the "add writers" action
  addWriters() {
    this.popoverCtrl.dismiss({ action: 'addWriters' });
  }
}
