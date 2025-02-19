import { inject, Injectable } from '@angular/core';
import { Auth, User, user } from '@angular/fire/auth';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class AuthService {
  private auth = inject(Auth) ;

  getConnectedUser(): Observable<User | null > {
    return user(this.auth);
  }


  constructor() { }
}
