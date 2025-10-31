import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormBuilder, FormGroup, Validators, ReactiveFormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { takeUntil } from 'rxjs/operators';
import { UsuarioService } from '../../services/usuario.service';
import { AlumnoService } from '../../services/alumno.service';
import { SeccionService } from '../../services/seccion.service';

@Component({
  selector: 'app-register-user',
  standalone: true,
  imports: [CommonModule, ReactiveFormsModule],
  templateUrl: './register-user.component.html',
  styleUrls: ['./register-user.component.scss']
})
export class RegisterUserComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();

  registerForm: FormGroup;
  loading = false;
  isDarkMode = false;

  // Datos para dropdowns
  secciones: any[] = [];

  // Mensajes
  successMessage = '';
  errorMessage = '';

  constructor(
    private fb: FormBuilder,
    private router: Router,
    private usuarioService: UsuarioService,
    private alumnoService: AlumnoService,
    private seccionService: SeccionService
  ) {
    this.registerForm = this.fb.group({
      usuario: ['', [Validators.required, Validators.minLength(3)]],
      password: ['', [Validators.required, Validators.minLength(6)]],
      confirmPassword: ['', [Validators.required]],
      nombre: ['', [Validators.required]],
      dni: ['', [Validators.required, Validators.pattern(/^\d{8}$/)]],
      grado: ['', [Validators.required]],
      institucionid: [1, [Validators.required]], // Institución fija ID 1
      seccionid: ['', [Validators.required]]
    }, { validators: this.passwordMatchValidator });
  }

  ngOnInit(): void {
    this.loadTheme();
    this.loadSecciones(); // Cargar secciones directamente para institución ID 1
    this.setupThemeListener();
  }

  ngOnDestroy(): void {
    this.destroy$.next();
    this.destroy$.complete();
    if (this.themeListener) {
      window.removeEventListener('storage', this.themeListener);
    }
  }

  private themeListener?: () => void;

  private setupThemeListener(): void {
    // Escuchar cambios en el localStorage desde otros tabs
    this.themeListener = () => {
      this.loadTheme();
    };
    window.addEventListener('storage', this.themeListener);

    // Escuchar cambios en el mismo tab usando un intervalo
    setInterval(() => {
      const currentTheme = localStorage.getItem('theme');
      const shouldBeDark = currentTheme === 'dark';
      if (this.isDarkMode !== shouldBeDark) {
        this.loadTheme();
      }
    }, 100);
  }

  private loadTheme(): void {
    this.isDarkMode = localStorage.getItem('theme') === 'dark';
  }

  passwordMatchValidator(form: FormGroup) {
    const password = form.get('password');
    const confirmPassword = form.get('confirmPassword');

    if (password && confirmPassword && password.value !== confirmPassword.value) {
      confirmPassword.setErrors({ passwordMismatch: true });
      return { passwordMismatch: true };
    }

    if (confirmPassword && confirmPassword.errors && confirmPassword.errors['passwordMismatch']) {
      delete confirmPassword.errors['passwordMismatch'];
      if (Object.keys(confirmPassword.errors).length === 0) {
        confirmPassword.setErrors(null);
      }
    }

    return null;
  }



  loadSecciones(): void {
    console.log('Cargando secciones para institución ID 1');

    this.seccionService.getSeccions()
      .pipe(takeUntil(this.destroy$))
      .subscribe({
        next: (data: any) => {
          console.log('Secciones recibidas:', data);
          // Filtrar secciones por institución ID 1
          this.secciones = (data || []).filter((seccion: any) => Number(seccion.institucionid) === 1);
          console.log('Secciones filtradas:', this.secciones);
        },
        error: (error: any) => {
          console.error('Error al cargar secciones:', error);
        }
      });
  }

  onSubmit(): void {
    if (this.registerForm.valid) {
      this.loading = true;
      this.errorMessage = '';
      this.successMessage = '';

      const formData = this.registerForm.value;

      // Preparar datos del alumno
      const alumnoData = {
        nombre: formData.nombre,
        numero: formData.dni, // DNI se guarda en el campo numero
        grado: formData.grado,
        institucionid: formData.institucionid,
        seccionid: formData.seccionid,
        is_actived: 1,
        is_deleted: 0
      };

      // Preparar datos del usuario
      const usuarioData: any = {
        usuario: formData.usuario,
        numero: formData.dni, // Agregar el DNI al usuario
        password: formData.password, // Se encriptará en el backend
        tipousuarioid: 1, // Tipo alumno
        grado: formData.grado,
        is_actived: 1,
        is_deleted: 0
      };

      // Registrar alumno primero
      this.alumnoService.createAlumnoWithData(alumnoData)
        .pipe(takeUntil(this.destroy$))
        .subscribe({
          next: (alumnoResponse: any) => {
            console.log('Alumno creado:', alumnoResponse);

            // Registrar usuario con referencia al alumno
            usuarioData['aludocenid'] = alumnoResponse.alumno.id;

            this.usuarioService.createUsuarioWithPassword(usuarioData)
              .pipe(takeUntil(this.destroy$))
              .subscribe({
                next: (usuarioResponse: any) => {
                  console.log('Usuario creado:', usuarioResponse);
                  this.successMessage = 'Usuario registrado exitosamente';
                  this.registerForm.reset();
                  this.loading = false;

                  // Limpiar dropdowns
                  this.secciones = [];
                },
                error: (error) => {
                  console.error('Error al crear usuario:', error);
                  this.errorMessage = 'Error al crear el usuario';
                  this.loading = false;
                }
              });
          },
          error: (error) => {
            console.error('Error al crear alumno:', error);
            this.errorMessage = 'Error al crear el alumno';
            this.loading = false;
          }
        });
    } else {
      this.markFormGroupTouched();
    }
  }

  private markFormGroupTouched(): void {
    Object.keys(this.registerForm.controls).forEach(key => {
      const control = this.registerForm.get(key);
      control?.markAsTouched();
    });
  }

  goBack(): void {
    this.router.navigate(['/estudiantes']);
  }

  getErrorMessage(fieldName: string): string {
    const control = this.registerForm.get(fieldName);
    if (control?.hasError('required')) {
      return `${this.getFieldLabel(fieldName)} es requerido`;
    }
    if (control?.hasError('minlength')) {
      const requiredLength = control.errors?.['minlength']?.requiredLength;
      return `${this.getFieldLabel(fieldName)} debe tener al menos ${requiredLength} caracteres`;
    }
    if (control?.hasError('passwordMismatch')) {
      return 'Las contraseñas no coinciden';
    }
    return '';
  }

  private getFieldLabel(fieldName: string): string {
    const labels: { [key: string]: string } = {
      usuario: 'Usuario',
      password: 'Contraseña',
      confirmPassword: 'Confirmar contraseña',
      nombre: 'Nombre',
      dni: 'DNI',
      grado: 'Grado',
      institucionid: 'Institución',
      seccionid: 'Sección'
    };
    return labels[fieldName] || fieldName;
  }

  isFieldInvalid(fieldName: string): boolean {
    const control = this.registerForm.get(fieldName);
    return !!(control && control.invalid && control.touched);
  }
}
