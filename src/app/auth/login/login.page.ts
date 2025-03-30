import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonContent, IonItem, IonButton, IonLabel, IonInput, IonText, IonIcon } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { RouterLink } from '@angular/router';
import { addIcons } from 'ionicons';
import { eyeOutline, eyeOffOutline, logoGoogle } from 'ionicons/icons';

@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonIcon, IonText, IonContent, CommonModule, FormsModule,IonItem, IonButton, IonLabel, IonInput, ReactiveFormsModule,RouterLink
  ]
})
export class LoginPage implements OnInit {
  loginForm: FormGroup;
  errorMessage: string = '';
  showPassword: boolean = false;

  constructor(
    private authService: AuthService,
    private fb: FormBuilder,
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });

    addIcons({'eyeOutline':eyeOutline,'eyeOffOutline':eyeOffOutline,'logoGoogle':logoGoogle});
  }

  ngOnInit() {
  }

  togglePasswordVisibility() {
    this.showPassword = !this.showPassword;
  }

  async onLogin() {
    if (this.loginForm.valid) {
      try {
        this.errorMessage = '';
        await this.authService.login(
          this.loginForm.get('email')?.value,
          this.loginForm.get('password')?.value
        );
      } catch (error: any) {
        this.errorMessage = error.message || 'Login failed';
      }
    } else {
      this.loginForm.markAllAsTouched();
      if (this.loginForm.get('email')?.invalid) {
        this.errorMessage = 'Please enter a valid email address';
      } else if (this.loginForm.get('password')?.invalid) {
        this.errorMessage = 'Password must be at least 8 characters';
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

  async onResetPassword() {
    const email = this.loginForm.get('email')?.value;
    if (email) {
      try {
        await this.authService.resetPassword(email);
        this.errorMessage = 'Password reset email sent';
      } catch (error: any) {
        this.errorMessage = error.message || 'Failed to send reset email';
      }
    } else {
      this.errorMessage = 'Please enter your email first';
    }
  }
}
