import { Injectable, inject } from '@angular/core';
import { Auth, User, user, signInWithEmailAndPassword, signOut, createUserWithEmailAndPassword, sendEmailVerification, sendPasswordResetEmail, GoogleAuthProvider, signInWithPopup, signInWithCredential } from '@angular/fire/auth';
import { Router } from '@angular/router';
import { Platform } from '@ionic/angular';
import { Observable } from 'rxjs';
import { FirebaseAuthentication } from '@capacitor-firebase/authentication';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth);
  private router = inject(Router);
  private googleProvider = new GoogleAuthProvider();
  private platform = inject(Platform);

  constructor() {
    this.googleProvider.setCustomParameters({ prompt: 'select_account' });
  }

  // Observateur de l'état d'authentification
  getConnectedUser(): Observable<User | null> {
    return user(this.auth);
  }

  // Connexion email/mot de passe
  async login(email: string, password: string): Promise<void> {
    const result = await signInWithEmailAndPassword(this.auth, email, password);
    if (!result.user.emailVerified) {
      await signOut(this.auth);
      throw new Error('Vérifiez votre email avant de vous connecter');
    }
    await this.router.navigate(['/topics']);
  }

  async register(email: string, password: string): Promise<void> {
    const result = await createUserWithEmailAndPassword(this.auth, email, password);
    await sendEmailVerification(result.user);
    await this.router.navigate(['/login']);
  }

  async signInWithGoogle(): Promise<void> {
    try {
      let credential;
      let isNewUser = false;

      if (this.platform.is('desktop') || this.platform.is('mobileweb')) {
        const result = await signInWithPopup(this.auth, this.googleProvider);
        isNewUser = result.user.metadata.creationTime === result.user.metadata.lastSignInTime;
        credential = result.user;
      } else {
        const result = await FirebaseAuthentication.signInWithGoogle();
        if (result.credential?.idToken) {
          const googleCredential = GoogleAuthProvider.credential(result.credential.idToken);
          const userCredential = await signInWithCredential(this.auth, googleCredential);
          isNewUser = userCredential.user.metadata.creationTime === userCredential.user.metadata.lastSignInTime;
          credential = userCredential.user;
        }
      }

      if (isNewUser && credential) {
        await sendEmailVerification(credential);
        await signOut(this.auth);
        throw new Error('Vérifiez votre email avant de vous connecter');
      } else {
        await this.router.navigate(['/topics']);
      }
    } catch (error) {
      console.error('Google sign-in error:', error);
      throw error;
    }
  }

  async resetPassword(email: string): Promise<void> {
    await sendPasswordResetEmail(this.auth, email);
  }

  async logout(): Promise<void> {
    await signOut(this.auth);
  }
}
