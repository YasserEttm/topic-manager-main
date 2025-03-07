
import { inject, Injectable } from '@angular/core';
import { Auth, User, user, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
 // private auth = inject(Auth) ;


  constructor(
    private auth: Auth,
    private router: Router,) {}

  getConnectedUser(): Observable<User | null > {
    return user(this.auth);
  }

  async login(email: string, password: string): Promise<void> {
    try {
      const result = await signInWithEmailAndPassword(this.auth, email, password);
  
      if (!result.user.emailVerified) {
        await signOut(this.auth);
        throw new Error("Please verify your email before logging in!");
      }
  
      await this.router.navigate(['/topics']);
    } catch (error) {
      throw error;
    }
  }
  
  async register(email: string, password: string): Promise<void> {
    try {
      const result = await createUserWithEmailAndPassword(this.auth, email, password);
      await sendEmailVerification(result.user);
      await signOut(this.auth);
      await this.router.navigate(['/login']);
    } catch (error: any) {
      console.error('Registration error:', error); 
      if (error.code === 'auth/email-already-in-use') {
        throw new Error('Email already in use');
      } else if (error.code === 'auth/weak-password') {
        throw new Error('Password is too weak');
      } else if (error.code === 'auth/invalid-credential') {
        throw new Error('Invalid credentials. Please check your Firebase configuration.');
      }
      throw error;
    }
  }

  async resetPassword(email: string): Promise<void> {
    try {
      await sendPasswordResetEmail(this.auth, email);
    } catch (error){
      throw error;
    }
  }
}

