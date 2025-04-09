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
      let firebaseUser: User | null = null;
  
      // Desktop ou mobile web
      if (this.platform.is('desktop') || this.platform.is('mobileweb')) {
        const result = await signInWithPopup(this.auth, this.googleProvider);
        firebaseUser = result.user;
      } else {
        // Mobile natif avec Capacitor
        const result = await FirebaseAuthentication.signInWithGoogle();
        if (result.credential?.idToken) {
          const googleCredential = GoogleAuthProvider.credential(result.credential.idToken);
          const resultAuth = await signInWithCredential(this.auth, googleCredential);
          firebaseUser = resultAuth.user;
        } else {
          throw new Error("Impossible de récupérer l'identifiant Google");
        }
      }
  
      if (!firebaseUser) {
        throw new Error("Échec de l'authentification Google");
      }
  
      // Navigation après connexion réussie
      await this.router.navigate(['/topics']);
    } catch (error) {
      console.error('Erreur de connexion Google :', error);
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
