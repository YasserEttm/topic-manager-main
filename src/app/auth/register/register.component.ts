import { Component, OnInit } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonButton, IonLabel, IonInput, IonCard, IonCardContent, IonText, IonIcon } from '@ionic/angular/standalone';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { eyeOffOutline, eyeOutline, logoGoogle } from 'ionicons/icons';

@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  standalone: true,
  imports: [IonIcon, CommonModule, FormsModule, ReactiveFormsModule,RouterLink, IonCard, IonCardContent, IonButton, IonItem, IonLabel, IonInput, IonText, IonContent
  ]
})
export class RegisterComponent implements OnInit {
  registerForm: FormGroup;
  errorMessage: string = '';
  showPassword: boolean = false;
  showConfirmPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
  ) {
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator() });

    addIcons({ eyeOutline, eyeOffOutline, logoGoogle });
  }

  ngOnInit() {
  }

  passwordMatchValidator(): ValidatorFn {
    return (form: AbstractControl): {[key: string]: any} | null => {
      const password = form.get('password');
      const confirmPassword = form.get('confirmPassword');
      return password && confirmPassword && password.value === confirmPassword.value
        ? null
        : { passwordMismatch: true };
    };
  }

  togglePasswordVisibility(field: 'password' | 'confirmPassword') {
    if (field === 'password') {
      this.showPassword = !this.showPassword;
    } else {
      this.showConfirmPassword = !this.showConfirmPassword;
    }
  }

  async onRegister() {
    if (this.registerForm.valid) {
      try {
        this.errorMessage = '';
        await this.authService.register(
          this.registerForm.get('email')?.value,
          this.registerForm.get('password')?.value
        );
      } catch (error: any) {
        this.errorMessage = error.message || 'Registration failed';
      }
    } else {
      this.registerForm.markAllAsTouched();
      if (this.registerForm.get('email')?.invalid) {
        this.errorMessage = 'Please enter a valid email address';
      } else if (this.registerForm.get('password')?.invalid) {
        this.errorMessage = 'Password must be at least 8 characters';
      } else if (this.registerForm.hasError('passwordMismatch')) {
        this.errorMessage = 'Passwords do not match';
      }
    }
  }

  async onGoogleSignIn() {
    try {
      this.errorMessage = '';
      await this.authService.signInWithGoogle();
    } catch (error: any) {
      this.errorMessage = error.message || 'Google Sign-In failed';
    }
  }
}
