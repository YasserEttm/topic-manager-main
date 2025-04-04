import { Component, inject, OnInit } from '@angular/core';
import { toSignal } from '@angular/core/rxjs-interop';
import {
  AbstractControl,
  FormBuilder,
  ReactiveFormsModule,
  StatusChangeEvent,
  TouchedChangeEvent,
  Validators,
} from '@angular/forms';
import { IonicModule } from '@ionic/angular';
import { TopicService } from 'src/app/services/topic.service';
import { ModalController } from '@ionic/angular/standalone';
import { Topic } from 'src/app/models/topic';
import { CommonModule } from '@angular/common';
import { Observable, filter, map } from 'rxjs';

@Component({
  selector: 'app-create-topic',
  imports: [IonicModule, ReactiveFormsModule, CommonModule],
  template: `
    <form [formGroup]="topicForm" (ngSubmit)="onSubmit()">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button (click)="cancel()" color="medium">Cancel</ion-button>
          </ion-buttons>
          <ion-title>Welcome</ion-title>
          <ion-buttons slot="end">
            <ion-button
              type="submit"
              [disabled]="this.topicForm.invalid"
              [strong]="true"
              >Confirm</ion-button
            >
          </ion-buttons>
        </ion-toolbar>
      </ion-header>
      <ion-content class="ion-padding" [fullscreen]="true">
        <ion-input
          formControlName="name"
          fill="solid"
          name="name"
          label="Enter topic name"
          labelPlacement="floating"
          placeholder="Topic name"
          [helperText]="
            'Enter a name with at least ' + NAME_MIN_LENGTH + ' characters.'
          "
        ></ion-input>
      </ion-content>
    </form>
  `,
})
export class CreateTopicModal implements OnInit {
  private readonly topicService = inject(TopicService);
  private readonly fb = inject(FormBuilder);
  private readonly modalCtrl = inject(ModalController);

  readonly NAME_MIN_LENGTH = 3;

  topic: Topic | undefined;

  ngOnInit(): void {
    if (this.topic) this.topicNameControl?.setValue(this.topic?.name);
  }

  topicForm = this.fb.group({
    name: [
      '',
      [Validators.required, Validators.minLength(this.NAME_MIN_LENGTH)],
    ],
  });

  errorText$: Observable<string> = this.topicForm.events.pipe(
    filter(
      (event) =>
        event instanceof StatusChangeEvent ||
        event instanceof TouchedChangeEvent
    ),
    map(() => {
      if (
        this.topicNameControl?.errors &&
        this.topicNameControl?.errors['required']
      ) {
        return 'This field is required';
      }
      if (
        this.topicNameControl?.errors &&
        this.topicNameControl?.errors['minlength']
      ) {
        return `Name should have at least ${this.NAME_MIN_LENGTH} characters`;
      }
      return '';
    })
  );

  errorText = toSignal(this.errorText$);

  get topicNameControl(): AbstractControl<string | null, string | null> | null {
    return this.topicForm.get('name');
  }

  cancel(): void {
    this.modalCtrl.dismiss();
  }

  onSubmit(): void {
    if (this.topic?.id) {
      // Edit existing topic
      this.topicService.editTopic(this.topic.id, {
        name: this.topicForm.value.name!,
      }).subscribe({
        next: () => {
          // Close the modal explicitly
          this.modalCtrl.dismiss(null, 'submit'); // Dismiss with a 'submit' role
        },
        error: (err) => {
          console.error('Failed to edit topic:', err);
        },
      });
    } else {
      // Add new topic
      this.topicService.addTopic(this.topicForm.value.name!, []).subscribe({
        next: () => {
          // Close the modal explicitly
          this.modalCtrl.dismiss(null, 'submit'); // Dismiss with a 'submit' role
        },
        error: (err) => {
          console.error('Failed to add topic:', err);
        },
      });
    }
  }
  
}
