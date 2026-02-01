import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormBuilder, ReactiveFormsModule, Validators } from '@angular/forms';
import { Router, RouterLink } from '@angular/router';
import { AuthService } from '../../../../core/auth/auth.service';

import { CardModule } from 'primeng/card';
import { ButtonModule } from 'primeng/button';
import { InputTextModule } from 'primeng/inputtext';
import { PasswordModule } from 'primeng/password';
import { MessageModule } from 'primeng/message';
import { FloatLabelModule } from 'primeng/floatlabel';

@Component({
  selector: 'app-register',
  standalone: true,
  imports: [
    CommonModule,
    ReactiveFormsModule,
    RouterLink,
    CardModule,
    ButtonModule,
    InputTextModule,
    PasswordModule,
    MessageModule,
    FloatLabelModule
  ],
  templateUrl: './register.component.html',
  styleUrl: './register.component.scss',
})
export class RegisterComponent {
  private fb = inject(FormBuilder);
  private authService = inject(AuthService);
  private router = inject(Router);

  registerForm = this.fb.group({
    email: ['', [Validators.required, Validators.email]],
    password: ['', [Validators.required, Validators.minLength(8)]],
  });

  error = '';
  loading = false;

  onSubmit() {
    if (this.registerForm.valid) {
      this.loading = true;
      this.error = '';
      const { email, password } = this.registerForm.value;

      this.authService.register({ email: email!, password: password! }).subscribe({
        next: () => {
          this.loading = false;
          // Después de registro exitoso, redirigir al login
          this.router.navigate(['/auth/login']);
        },
        error: (err) => {
          this.loading = false;
          if (err.status === 409) {
            this.error = 'Este email ya está registrado';
          } else {
            this.error = 'Ocurrió un error al registrarse';
          }
          console.error(err);
        }
      });
    }
  }
}
