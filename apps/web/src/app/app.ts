import { Component, inject } from '@angular/core';
import { RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { ButtonModule } from 'primeng/button';
import { MenuModule } from 'primeng/menu';
import { AvatarModule } from 'primeng/avatar';
import { AuthService } from './core/auth/auth.service';

@Component({
  imports: [RouterModule, CommonModule, ButtonModule, MenuModule, AvatarModule],
  selector: 'app-root',
  templateUrl: './app.html',
  styleUrl: './app.scss',
})
export class App {
  authService = inject(AuthService);

  userMenuItems = [
    { label: 'Mi Perfil', icon: 'pi pi-user' },
    { label: 'Ajustes', icon: 'pi pi-cog' },
    { separator: true },
    { label: 'Cerrar Sesión', icon: 'pi pi-power-off', command: () => this.logout() }
  ];

  logout() {
    this.authService.logout();
  }
}
