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
import { generateUUID } from 'src/app/utils/generate-uuid';
import { CommonModule } from '@angular/common';

@Component({
  selector: 'app-create-post',
  imports: [CommonModule, IonicModule, ReactiveFormsModule],
  template: `
    <form [formGroup]="postForm" (ngSubmit)="onSubmit()">
      <ion-header>
        <ion-toolbar>
          <ion-buttons slot="start">
            <ion-button (click)="cancel()" color="medium">Cancel</ion-button>
          </ion-buttons>
          <ion-title>{{ post ? 'Edit' : 'Create' }} Post</ion-title>
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

        <ion-item>
          <ion-label>Post Image</ion-label>
          <input type="file" accept="image/*" (change)="onFileSelected($event)" #fileInput>
        </ion-item>

        <!-- Aperçu de l'image -->
        <div *ngIf="imagePreview || post?.imageUrl" class="image-preview">
          <img
            [src]="imagePreview || post?.imageUrl"
            style="max-width: 100%; max-height: 200px; margin-top: 16px;">

          <ion-button *ngIf="imagePreview || post?.imageUrl"
                     fill="clear"
                     color="danger"
                     (click)="removeImage()">
            <ion-icon name="trash-outline" slot="icon-only"></ion-icon>
          </ion-button>
        </div>
      </ion-content>
    </form>
  `,
  styles: [`
    .image-preview {
      position: relative;
      display: inline-block;
      margin-top: 16px;
    }
    .image-preview ion-button {
      position: absolute;
      top: 0;
      right: 0;
    }
  `]
})
export class CreatePostModal implements OnInit {
  private readonly topicService = inject(TopicService);
  private readonly fb = inject(FormBuilder);
  private readonly modalCtrl = inject(ModalController);

  readonly DESCRIPTION_MAX_LENGTH = 255;
  readonly NAME_MIN_LENGTH = 3;

  @Input() topicId!: string;
  @Input() post: Post | undefined;

  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isRemovingImage = false;

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

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.selectedFile = input.files[0];
      this.isRemovingImage = false;

      // Créer un aperçu
      const reader = new FileReader();
      reader.onload = () => {
        this.imagePreview = reader.result as string;
      };
      reader.readAsDataURL(this.selectedFile);
    }
  }

  removeImage(): void {
    this.isRemovingImage = true;
    this.imagePreview = null;
    this.selectedFile = null;
  }

  async onSubmit(): Promise<void> {
    try {
      if (this.post?.id) {
        // Édition du post
        let imageUrl = this.post.imageUrl;

        if (this.isRemovingImage && imageUrl) {
          // Supprimer l'image existante
          await this.topicService.deletePostImage(imageUrl);
          imageUrl = undefined;
        } else if (this.selectedFile) {
          // Remplacer l'image existante
          if (imageUrl) {
            try {
              await this.topicService.deletePostImage(imageUrl);
            } catch (error) {
              console.warn('Failed to delete old image:', error);
            }
          }
          imageUrl = await this.topicService.uploadPostImage(
            this.topicId,
            this.post.id,
            this.selectedFile
          );
        }

        this.topicService.editPost(this.topicId, {
          ...this.post,
          name: this.postForm.value.name!,
          description: this.postForm.value.description!,
          imageUrl
        }).subscribe({
          next: () => {
            this.modalCtrl.dismiss(true);
          },
          error: (err) => {
            console.error('Error updating post:', err);
          }
        });
      } else {
        // Création d'un nouveau post
        let imageUrl: string | undefined;

        if (this.selectedFile) {
          const postId = generateUUID(); // Générer un ID temporaire pour le stockage
          imageUrl = await this.topicService.uploadPostImage(
            this.topicId,
            postId,
            this.selectedFile
          );
        }

        const newPost = {
          name: this.postForm.value.name!,
          description: this.postForm.value.description!,
          imageUrl
        };

        this.topicService.addPost(this.topicId, newPost).subscribe({
          next: (post) => {
            this.modalCtrl.dismiss(true);
          },
          error: (err) => {
            console.error('Error creating post:', err);
          }
        });
      }
    } catch (error) {
      console.error('Error:', error);
    }
  }
}
