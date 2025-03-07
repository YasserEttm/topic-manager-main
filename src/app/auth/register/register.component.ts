import { Component, OnInit } from '@angular/core';
import { IonContent, IonHeader, IonTitle, IonToolbar, IonItem, IonButton, IonLabel, IonInput, IonAlert, IonCard, IonCardContent, IonText } from '@ionic/angular/standalone';
import { FormsModule, ReactiveFormsModule, FormBuilder, FormGroup, Validators, AbstractControl, ValidatorFn } from '@angular/forms';
import { AuthService } from 'src/app/services/auth.service';
import { CommonModule } from '@angular/common';
import { RouterLink } from '@angular/router';



@Component({
  selector: 'app-register',
  templateUrl: './register.component.html',
  styleUrls: ['./register.component.scss'],
  imports: [CommonModule, FormsModule, ReactiveFormsModule, RouterLink, IonCard, IonCardContent, IonButton, IonItem, IonLabel,IonInput, IonText, IonContent]
})
export class RegisterComponent  {
  registerForm: FormGroup;
  errorMessage: string = '';

  constructor(
    private fb: FormBuilder,
    private authService: AuthService
      
    
  ) { 
    this.registerForm = this.fb.group({
      email: ['', [Validators.required, Validators.email]],
      password: ['',[Validators.required, Validators.minLength(6)]],
      confirmPassword: ['',[Validators.required]]
    }, { Validators: this.passwordMatchValidator() });
  }
  passwordMatchValidator(): ValidatorFn {
    return (form: AbstractControl): {[key: string]: any} | null => {
      const password = form.get('password');
      const confirmPassword = form.get('confirmPassword');

      return password && confirmPassword && password.value == confirmPassword.value 
        ? null
        : {'passwordMismatch': true};
    };
  }

  async onRegister(){
    if (this.registerForm.valid) {
      try {
        this.errorMessage = '';
        await this.authService.register(
          this.registerForm.get('email')?.value,
          this.registerForm.get('password')?.value
        );
      } catch (error: any) {
        this.errorMessage = error.message || 'Registration failed'
      }
    } else {
      this.registerForm.markAllAsTouched();
    }
  }

}
