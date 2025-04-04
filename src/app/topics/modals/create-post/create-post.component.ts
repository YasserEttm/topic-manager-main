import { Component, inject, Input, OnInit } from '@angular/core';
import {
  FormBuilder,
  FormGroup,
  ReactiveFormsModule,
  Validators,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { IonicModule, ModalController } from '@ionic/angular';
import { TopicService } from 'src/app/services/topic.service';
import { Post } from 'src/app/models/post';
import { finalize } from 'rxjs';
import { generateUUID } from 'src/app/utils/generate-uuid';
import { DomSanitizer, SafeUrl } from '@angular/platform-browser';
import { AzureStorageService } from 'src/app/services/azure-storage.service';
import { Capacitor } from '@capacitor/core';
import { NavbarComponent } from "../../../shared/navbar/navbar.component";

@Component({
  selector: 'app-create-post',
  standalone: true,
  imports: [CommonModule, IonicModule, ReactiveFormsModule, NavbarComponent],
  templateUrl: './create-post.component.html',
  styleUrls: ['../topics.scss']
})
export class CreatePostModal implements OnInit {
  private readonly topicService = inject(TopicService);
  private readonly fb = inject(FormBuilder);
  private readonly modalCtrl = inject(ModalController);
  private readonly sanitizer = inject(DomSanitizer);
  private readonly azureStorage = inject(AzureStorageService);

  readonly DESCRIPTION_MAX_LENGTH = 255;
  readonly NAME_MIN_LENGTH = 3;

  @Input() topicId!: string;
  @Input() post: Post | undefined;

  selectedFile: File | null = null;
  imagePreview: string | null = null;
  isRemovingImage = false;
  isSubmitting = false;
  isMobileApp = false;

  imagePreviewSafe: SafeUrl | null = null;
  postImageSafe: SafeUrl | null = null;

  postForm!: FormGroup;

  constructor() {
    this.initForm();
  }

  initForm(): void {
    this.postForm = this.fb.group({
      name: ['', [Validators.required, Validators.minLength(this.NAME_MIN_LENGTH)]],
      description: ['', [Validators.maxLength(this.DESCRIPTION_MAX_LENGTH)]]
    });
  }

  async ngOnInit(): Promise<void> {
    this.isMobileApp = Capacitor.isNativePlatform();

    if (this.post) {
      this.postForm.patchValue({
        name: this.post.name,
        description: this.post.description || ''
      });

      if (this.post.imageUrl) {
        try {
          this.postImageSafe = await this.azureStorage.getImageUrl(this.post.imageUrl);
        } catch (error) {
          console.error('Error loading post image:', error);
        }
      }
    }
  }

  isControlInvalid(controlName: string): boolean {
    const control = this.postForm.get(controlName);
    return !!control && control.invalid && (control.dirty || control.touched);
  }

  getNameErrorMessage(): string {
    const control = this.postForm.get('name');
    if (!control) return '';
    if (control.hasError('required')) return 'Destination name is required';
    if (control.hasError('minlength')) return `Name should have at least ${this.NAME_MIN_LENGTH} characters`;
    return '';
  }

  get descriptionErrorText(): string {
    return `Description should have less than ${this.DESCRIPTION_MAX_LENGTH} characters`;
  }

  cancel(): void {
    this.modalCtrl.dismiss(false);
  }

  async openCameraOrGallery(): Promise<void> {
    const isMobile = !!(navigator.userAgent.match(/Android/i) || navigator.userAgent.match(/iPhone|iPad/i));
    if (isMobile) {
      try {
        const { Camera, CameraResultType, CameraSource } = await import('@capacitor/camera');
        const image = await Camera.getPhoto({
          quality: 90,
          allowEditing: false,
          resultType: CameraResultType.DataUrl,
          source: CameraSource.Photos,
        });

        this.imagePreview = image.dataUrl!;
        this.imagePreviewSafe = this.sanitizer.bypassSecurityTrustUrl(image.dataUrl!);
        const blob = await (await fetch(image.dataUrl!)).blob();
        const fileName = `image_${new Date().getTime()}.jpeg`;
        this.selectedFile = new File([blob], fileName, { type: blob.type });
      } catch (error) {
        console.error('Error loading image:', error);
      }
    } else {
      const input = document.createElement('input');
      input.type = 'file';
      input.accept = 'image/*';
      input.click();
      input.onchange = async () => {
        const file = input.files?.[0];
        if (file) {
          this.selectedFile = file;
          const reader = new FileReader();
          reader.onload = () => {
            this.imagePreview = reader.result as string;
            this.imagePreviewSafe = this.sanitizer.bypassSecurityTrustUrl(reader.result as string);
          };
          reader.readAsDataURL(file);
        }
      };
    }
  }

  removeImage(): void {
    this.isRemovingImage = true;
    this.imagePreview = null;
    this.imagePreviewSafe = null;
    this.postImageSafe = null;
    this.selectedFile = null;
  }

  async onSubmit(): Promise<void> {
    if (this.postForm.invalid) return;
    this.isSubmitting = true;

    try {
      if (this.post?.id) {
        const updatedPost = {
          ...this.post,
          name: this.postForm.value.name,
          description: this.postForm.value.description,
        };

        if (this.isRemovingImage) {
          updatedPost.imageUrl = undefined;
        } else if (this.selectedFile && !this.isMobileApp) {
          try {
            updatedPost.imageUrl = await this.topicService.uploadPostImage(this.topicId, this.post.id, this.selectedFile);
          } catch (error) {
            console.error('Image upload error:', error);
          }
        }

        this.topicService.editPost(this.topicId, updatedPost)
          .pipe(finalize(() => this.isSubmitting = false))
          .subscribe({
            next: () => this.modalCtrl.dismiss(true),
            error: (err) => {
              console.error('Error updating post:', err);
              this.modalCtrl.dismiss(false);
            }
          });
      } else {
        const postId = generateUUID();
        let imageUrl: string | undefined;

        if (this.selectedFile && !this.isMobileApp) {
          try {
            imageUrl = await this.topicService.uploadPostImage(this.topicId, postId, this.selectedFile);
          } catch (error) {
            console.error('Image upload error:', error);
          }
        }

        const newPost: any = {
          id: postId,
          name: this.postForm.value.name,
          description: this.postForm.value.description
        };

        if (imageUrl) {
          newPost.imageUrl = imageUrl;
        }

        this.topicService.addPost(this.topicId, newPost)
          .pipe(finalize(() => this.isSubmitting = false))
          .subscribe({
            next: () => this.modalCtrl.dismiss(true),
            error: (err) => {
              console.error('Error creating post:', err);
              this.modalCtrl.dismiss(false);
            }
          });
      }
    } catch (error) {
      console.error('Error:', error);
      this.isSubmitting = false;
      this.modalCtrl.dismiss(false);
    }
  }
}
