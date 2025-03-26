import { Component, inject, OnInit, Input } from '@angular/core';
import { AbstractControl, FormBuilder, ReactiveFormsModule, StatusChangeEvent, TouchedChangeEvent, Validators } from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { ModalController } from '@ionic/angular/standalone';
import { TopicService } from 'src/app/services/topic.service';  // Ensure the topic service is imported
import { CommonModule } from '@angular/common';
import { Observable, filter, map } from 'rxjs';
import { toSignal } from '@angular/core/rxjs-interop';

@Component({
  selector: 'app-add-reader-modal',
  imports: [IonicModule, ReactiveFormsModule, CommonModule],
  template: `
    <form [formGroup]="readerForm" (ngSubmit)="onSubmit()">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button (click)="cancel()" color="medium">Cancel</ion-button>
          </ion-buttons>
          <ion-title>Add Reader</ion-title>
          <ion-buttons slot="end">
            <ion-button
              type="submit"
              [disabled]="readerForm.invalid"
              [strong]="true"
            >Confirm</ion-button>
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding" [fullscreen]="true">
        <ion-input
          formControlName="email"
          fill="solid"
          name="email"
          label="Enter Reader's Email"
          labelPlacement="floating"
          placeholder="Reader's Email"
        ></ion-input>
        <ion-text color="danger" *ngIf="errorText()">
          {{ errorText() }}
        </ion-text>
      </ion-content>
    </form>
  `,
})
export class AddReaderModal implements OnInit {
  private readonly topicService = inject(TopicService);
  private readonly fb = inject(FormBuilder);
  private readonly modalCtrl = inject(ModalController);

  // Input for topicId to pass it to the service
  @Input() topicId: string | undefined;

  // Form for adding a reader (email validation)
  readerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
  });

  // Error handling for form validation
  errorText$: Observable<string> = this.readerForm.events.pipe(
    filter((event) => event instanceof StatusChangeEvent || event instanceof TouchedChangeEvent),
    map(() => {
      if (this.emailControl?.errors?.['required']) {
        return 'Email is required';
      }
      if (this.emailControl?.errors?.['email']) {
        return 'Please enter a valid email';
      }
      return '';
    })
  );

  // Signal for error text (used for reactive updates)
  errorText = toSignal(this.errorText$);

  // Accessor for the email control in the form
  get emailControl(): AbstractControl<string | null, string | null> | null {
    return this.readerForm.get('email');
  }

  ngOnInit(): void {}

  // Close the modal
  cancel(): void {
    this.modalCtrl.dismiss();
  }

  // Submit the form
  onSubmit(): void {
    if (this.readerForm.valid && this.topicId) {
      const email = this.readerForm.value.email!;
      this.topicService.addReader(this.topicId, email).subscribe({
        next: () => {
          this.modalCtrl.dismiss({ email });
        },
        error: (err) => {
          console.error('Failed to add reader:', err);
        },
      });
    }
  }
}
