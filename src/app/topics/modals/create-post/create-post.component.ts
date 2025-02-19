import { Component, inject, Input, OnInit } from '@angular/core';
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
import { Post } from 'src/app/models/post';
import { toSignal } from '@angular/core/rxjs-interop';
import { Observable, filter, map } from 'rxjs';

@Component({
  selector: 'app-create-post',
  imports: [IonicModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="postForm" (ngSubmit)="onSubmit()">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button (click)="cancel()" color="medium">Cancel</ion-button>
          </ion-buttons>
          <ion-title>Welcome</ion-title>
          <ion-buttons slot="end">
            <ion-button
              type="submit"
              [disabled]="this.postForm.invalid"
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
          label="Enter post name"
          labelPlacement="floating"
          placeholder="Post name"
          [helperText]="
            'Enter a name with at least ' + NAME_MIN_LENGTH + ' characters.'
          "
          [errorText]="nameErrorText()"
        ></ion-input>
        <ion-input
          formControlName="description"
          fill="solid"
          label="Enter post description"
          labelPlacement="floating"
          placeholder="Post description"
          [helperText]="
            'Enter a description with a maximum of ' +
            DESCRIPTION_MAX_LENGTH +
            ' characters.'
          "
          [errorText]="descriptionErrorText"
        ></ion-input>
      </ion-content>
    </form>
  `,
})
export class CreatePostModal implements OnInit {
  private readonly topicService = inject(TopicService);
  private readonly fb = inject(FormBuilder);
  private readonly modalCtrl = inject(ModalController);

  readonly DESCRIPTION_MAX_LENGTH = 255;
  readonly NAME_MIN_LENGTH = 3;

  topicId!: string;
  post: Post | undefined;

  ngOnInit(): void {
    if (this.post) {
      this.postNameControl?.setValue(this.post.name);
      this.postDescriptionControl?.setValue(this.post.description ?? '');
    }
  }

  postForm = this.fb.group({
    name: [
      '',
      [Validators.required, Validators.minLength(this.NAME_MIN_LENGTH)],
    ],
    description: ['', [Validators.maxLength(this.DESCRIPTION_MAX_LENGTH)]],
  });

  nameErrorText$: Observable<string> = this.postForm.events.pipe(
    filter(
      (event) =>
        event instanceof StatusChangeEvent ||
        event instanceof TouchedChangeEvent
    ),
    map(() => {
      if (
        this.postNameControl?.errors &&
        this.postNameControl?.errors['required']
      ) {
        return 'This field is required';
      }
      if (
        this.postNameControl?.errors &&
        this.postNameControl?.errors['minlength']
      ) {
        return `Name should have at least ${this.NAME_MIN_LENGTH} characters`;
      }
      return '';
    })
  );

  nameErrorText = toSignal(this.nameErrorText$);
  descriptionErrorText = `Description should have less than ${this.DESCRIPTION_MAX_LENGTH} characters`;

  get postNameControl(): AbstractControl<string | null, string | null> | null {
    return this.postForm.get('name');
  }

  get postDescriptionControl(): AbstractControl<
    string | null,
    string | null
  > | null {
    return this.postForm.get('description');
  }

  cancel(): void {
    this.modalCtrl.dismiss();
  }

  onSubmit(): void {
    if (this.post?.id) {
      this.topicService.editPost(this.topicId, {
        ...this.post,
        name: this.postForm.value.name!,
      });
    } else {
      this.topicService.addPost(this.topicId, {
        name: this.postForm.value.name!,
        description: this.postForm.value.description!,
      });
    }

    this.modalCtrl.dismiss();
  }
}
