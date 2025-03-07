import { Component, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators } from '@angular/forms';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonButton, IonLabel, IonInput, IonText, IonCard, IonCardContent } from '@ionic/angular/standalone';
import { AuthService } from 'src/app/services/auth.service';
import { RouterLink } from '@angular/router';


@Component({
  selector: 'app-login',
  templateUrl: './login.page.html',
  styleUrls: ['./login.page.scss'],
  standalone: true,
  imports: [IonCardContent, IonCard, IonText, IonContent, IonHeader, IonTitle, IonToolbar, CommonModule, FormsModule, IonItem, IonButton, IonLabel, IonInput,  ReactiveFormsModule, RouterLink]
})
export class LoginPage {
  loginForm: FormGroup;
  errorMessage: String = '';

  constructor(
    private authService: AuthService,
    private fb: FormBuilder 
  ) {
    this.loginForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['', [Validators.required, Validators.minLength(8)]]
    });
  }

  async onLogin() {
    if (this.loginForm.valid) {
      try {
        this.errorMessage = '';
        await this.authService.login(
          this.loginForm.get('email')?.value,
          this.loginForm.get('password')?.value, 
        );
      } catch (error: any) {
        this.errorMessage = error.message || 'Login failed'
      }
    } else {
      this.loginForm.markAllAsTouched();
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

