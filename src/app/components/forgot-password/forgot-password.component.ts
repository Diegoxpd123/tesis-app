import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router, RouterModule } from '@angular/router';
import { CommonModule } from '@angular/common';
import { HttpClientModule } from '@angular/common/http';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { ForgotPasswordService } from '../../services/forgot-password.service';

@Component({
  selector: 'app-forgot-password',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule, HttpClientModule, RouterModule],
  templateUrl: './forgot-password.component.html',
  styleUrls: ['./forgot-password.component.scss']
})
export class ForgotPasswordComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  // Estados del flujo
  currentStep: number = 1;
  totalSteps: number = 3;

  // Formularios
  step1Form: FormGroup; // Usuario
  step2Form: FormGroup; // DNI
  step3Form: FormGroup; // Nueva contraseña

  // Estados
  loading: boolean = false;
  errorMessage: string = '';
  successMessage: string = '';
  userData: any = null;

  // Tema
  isDarkMode: boolean = false;
  private themeCheckInterval?: any;

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private forgotPasswordService: ForgotPasswordService
  ) {
    this.step1Form = this.fb.group({
      usuario: ['', [Validators.required, Validators.minLength(3)]]
    });

    this.step2Form = this.fb.group({
      dni: ['', [Validators.required, Validators.pattern(/^\d{4}$/)]]
    });

    this.step3Form = this.fb.group({
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadTheme();
    this.setupThemeListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.themeCheckInterval) {
      clearInterval(this.themeCheckInterval);
    }
  }

  private loadTheme(): void {
    this.isDarkMode = localStorage.getItem('theme') === 'dark';
  }

  private setupThemeListener(): void {
    // Verificar cambios de tema cada 100ms como en el home
    this.themeCheckInterval = setInterval(() => {
      const currentTheme = localStorage.getItem('theme');
      const shouldBeDark = currentTheme === 'dark';
      if (this.isDarkMode !== shouldBeDark) {
        this.loadTheme();
      }
    }, 100);
  }

  // Paso 1: Verificar usuario
  onStep1Submit(): void {
    if (this.step1Form.valid) {
      this.loading = true;
      this.errorMessage = '';

      const usuario = this.step1Form.get('usuario')?.value;

      this.forgotPasswordService.verifyUser(usuario)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            this.loading = false;
            if (response.success) {
              this.userData = response.usuario;
              this.currentStep = 2;
            } else {
              this.errorMessage = response.message || 'Usuario no encontrado';
            }
          },
          error: (error: any) => {
            this.loading = false;
            this.errorMessage = 'Error al verificar el usuario';
            console.error('Error:', error);
          }
        });
    }
  }

  // Paso 2: Verificar DNI
  onStep2Submit(): void {
    if (this.step2Form.valid) {
      this.loading = true;
      this.errorMessage = '';

      const dni = this.step2Form.get('dni')?.value;

      this.forgotPasswordService.verifyDNI(this.userData.id, dni)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            this.loading = false;
            if (response.success) {
              this.currentStep = 3;
            } else {
              this.errorMessage = response.message || 'DNI incorrecto';
            }
          },
          error: (error: any) => {
            this.loading = false;
            this.errorMessage = 'Error al verificar el DNI';
            console.error('Error:', error);
          }
        });
    }
  }

  // Paso 3: Cambiar contraseña
  onStep3Submit(): void {
    if (this.step3Form.valid) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const password = this.step3Form.get('password')?.value;

      this.forgotPasswordService.changePassword(this.userData.id, password)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (response: any) => {
            this.loading = false;
            if (response.success) {
              this.successMessage = 'Contraseña cambiada exitosamente';
              setTimeout(() => {
                this.router.navigate(['/login']);
              }, 2000);
            } else {
              this.errorMessage = response.message || 'Error al cambiar la contraseña';
            }
          },
          error: (error: any) => {
            this.loading = false;
            this.errorMessage = 'Error al cambiar la contraseña';
            console.error('Error:', error);
          }
        });
    }
  }

  // Navegación entre pasos
  goToStep(step: number): void {
    if (step >= 1 && step <= this.totalSteps) {
      this.currentStep = step;
      this.errorMessage = '';
      this.successMessage = '';
    }
  }

  goBack(): void {
    if (this.currentStep > 1) {
      this.currentStep--;
      this.errorMessage = '';
      this.successMessage = '';
    }
  }

  goToLogin(): void {
    this.router.navigate(['/login']);
  }

  // Validadores
  private passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }
    return null;
  }

  // Métodos de validación
  isFieldInvalid(form: FormGroup, fieldName: string): boolean {
    const control = form.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }

  getErrorMessage(form: FormGroup, fieldName: string): string {
    const control = form.get(fieldName);
    if (control && control.errors && control.touched) {
      if (control.errors['required']) {
        return `${this.getFieldLabel(fieldName)} es requerido`;
      }
      if (control.errors['minlength']) {
        return `${this.getFieldLabel(fieldName)} debe tener al menos ${control.errors['minlength'].requiredLength} caracteres`;
      }
      if (control.errors['pattern']) {
        if (fieldName === 'dni') {
          return 'Debe ingresar exactamente 4 dígitos';
        }
        return `${this.getFieldLabel(fieldName)} tiene un formato inválido`;
      }
      if (control.errors['passwordMismatch']) {
        return 'Las contraseñas no coinciden';
      }
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      usuario: 'Usuario',
      dni: 'DNI',
      password: 'Contraseña',
      confirmPassword: 'Confirmar contraseña'
    };
    return labels[fieldName] || fieldName;
  }

  // Métodos para el template
  getStepTitle(): string {
    switch (this.currentStep) {
      case 1: return 'Verificar Usuario';
      case 2: return 'Verificar Identidad';
      case 3: return 'Nueva Contraseña';
      default: return '';
    }
  }

  getStepDescription(): string {
    switch (this.currentStep) {
      case 1: return 'Ingresa tu nombre de usuario para continuar';
      case 2: return 'Ingresa los últimos 4 dígitos de tu DNI';
      case 3: return 'Crea una nueva contraseña segura';
      default: return '';
    }
  }

  getProgressPercentage(): number {
    return (this.currentStep / this.totalSteps) * 100;
  }

}
