import { Component, Input } from '@angular/core';
import { Router } from '@angular/router';
import { IonHeader, IonTitle, IonToolbar, IonButton, IonButtons, IonIcon, IonBackButton } from '@ionic/angular/standalone';
import { addIcons } from 'ionicons';
import { logOutOutline } from 'ionicons/icons';
import { AuthService } from 'src/app/services/auth.service';

@Component({
  selector: 'app-navbar',
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss'],
  standalone: true,
  imports: [IonButton, IonHeader, IonTitle, IonToolbar, IonButtons, IonIcon, IonBackButton]
})
export class NavbarComponent {
  @Input() pageTitle: string = '';

  constructor(
    private authService: AuthService,
    private router: Router
  ) {
    addIcons({ logOutOutline });
  }

  async logout() {
    try {
      await this.authService.logout();
      this.router.navigate(['/login']);
    } catch (error) {
      console.error('Logout error:', error);
    }
  }
}
