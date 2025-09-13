import { Component, OnInit, OnDestroy } from '@angular/core';
import { FormControl, FormGroup, Validators, AbstractControl } from '@angular/forms';
import { ActivatedRoute, Router } from '@angular/router';
import { UsuarioService } from '../../services/usuario.service';
import { TermsPrivacyService } from '../../services/terms-privacy.service';
import Toastify from 'toastify-js';

@Component({
  selector: 'app-login',
  standalone: false,
  templateUrl: './login.component.html',
  styleUrl: './login.component.scss'
})
export class LoginComponent implements OnInit, OnDestroy {

  mensajeLogin: string = '';
  colorMensaje: string = '';
  loading: boolean = false;
  showPassword: boolean = false;
  loginAttempts: number = 0;
  maxAttempts: number = 3;
  isBlocked: boolean = false;
  blockTime: number = 0;
  isDarkMode: boolean = false;
  private themeListener?: () => void;

  // Estado para mostrar modal de términos
  showTermsModal: boolean = false;

  // Exponer Math y Date para el template
  Math = Math;
  Date = Date;

  loginForm: FormGroup = new FormGroup({
    username: new FormControl('', [
      this.noSpacesValidator
    ]),
    password: new FormControl('', [])
  });

  constructor(
    private router: Router,
    private route: ActivatedRoute,
    private usuarioService: UsuarioService,
    private termsPrivacyService: TermsPrivacyService
  ) { }

  private loadTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode = savedTheme === 'dark';
  }

  private addBodyClass(): void {
    document.body.classList.add('login-page');
  }

  private removeBodyClass(): void {
    document.body.classList.remove('login-page');
  }

  private setupThemeListener(): void {
    // Escuchar cambios en el localStorage desde otros tabs
    this.themeListener = () => {
      this.loadTheme();
    };
    window.addEventListener('storage', this.themeListener);

    // Escuchar cambios en el mismo tab usando un intervalo (más simple y confiable)
    setInterval(() => {
      const currentTheme = localStorage.getItem('theme');
      const shouldBeDark = currentTheme === 'dark';
      if (this.isDarkMode !== shouldBeDark) {
        this.loadTheme();
      }
    }, 100); // Verificar cada 100ms
  }

  // Validador personalizado para espacios
  noSpacesValidator(control: AbstractControl): {[key: string]: any} | null {
    const hasSpaces = /\s/.test(control.value);
    return hasSpaces ? {'hasSpaces': {value: control.value}} : null;
  }

  // Obtener mensaje de error para un campo
  getFieldError(fieldName: string): string {
    const field = this.loginForm.get(fieldName);
    if (field?.errors && field.touched) {
      if (field.errors['hasSpaces']) {
        return 'El usuario no puede contener espacios';
      }
    }
    return '';
  }

  // Verificar si un campo tiene error
  hasFieldError(fieldName: string): boolean {
    const field = this.loginForm.get(fieldName);
    return !!(field?.errors && field.touched);
  }

  // Alternar visibilidad de contraseña
  togglePasswordVisibility(): void {
    this.showPassword = !this.showPassword;
  }

  // Verificar si el usuario está bloqueado
  checkIfBlocked(): boolean {
    if (this.isBlocked && this.blockTime > 0) {
      const now = Date.now();
      if (now < this.blockTime) {
        return true;
      } else {
        this.isBlocked = false;
        this.blockTime = 0;
        this.loginAttempts = 0;
      }
    }
    return false;
  }

  // Bloquear usuario temporalmente
  blockUser(): void {
    this.isBlocked = true;
    this.blockTime = Date.now() + (5 * 60 * 1000); // 5 minutos
    this.showError('Demasiados intentos fallidos. Intenta de nuevo en 5 minutos.');
  }

  // Mostrar error con Toastify
  showError(message: string): void {
    Toastify({
      text: message,
      duration: 4000,
      gravity: "top",
      position: "right",
      backgroundColor: "#ef4444",
      stopOnFocus: true
    }).showToast();
  }

  // Mostrar éxito con Toastify
  showSuccess(message: string): void {
    Toastify({
      text: message,
      duration: 3000,
      gravity: "top",
      position: "right",
      backgroundColor: "#10b981",
      stopOnFocus: true
    }).showToast();
  }

  login(): void {
    // Verificar si los campos están vacíos
    const username = this.loginForm.get('username')?.value?.trim();
    const password = this.loginForm.get('password')?.value?.trim();

    if (!username || !password) {
      this.mensajeLogin = '¡Completa todos los campos!';
      this.colorMensaje = 'red';
      return;
    }

    // Verificar si el usuario está bloqueado
    if (this.checkIfBlocked()) {
      const remainingTime = Math.ceil((this.blockTime - Date.now()) / 1000 / 60);
      this.showError(`Usuario bloqueado. Intenta de nuevo en ${remainingTime} minutos`);
      return;
    }

    // Mostrar loading
    this.loading = true;
    this.mensajeLogin = '';
    this.colorMensaje = '';

    this.usuarioService.login(username, password).subscribe({
      next: (response) => {
        if (response.success) {
          // Login exitoso
          this.loginAttempts = 0;
          this.isBlocked = false;
          this.blockTime = 0;

          const usuario = response.usuario;
          // Guardar datos en localStorage
          localStorage.setItem('usuario_id', usuario.id.toString());
          localStorage.setItem('alumno_id', usuario.aludocenid.toString());
          localStorage.setItem('usuario_tipo', usuario.tipousuarioid.toString());
          localStorage.setItem('usuario_nombre', usuario.usuario);


          this.mensajeLogin = `¡Bienvenido ${usuario.usuario}!`;
          this.colorMensaje = 'green';
          this.showSuccess(`¡Bienvenido ${usuario.usuario}!`);

          // Verificar si es el primer login y mostrar términos
          setTimeout(() => {
            if (this.termsPrivacyService.isFirstLogin()) {
              this.showTermsModal = true;
            } else {
              this.navigateToUserHome(usuario.tipousuarioid);
            }
          }, 1000);

        } else {
          // Login fallido
          this.loginAttempts++;
          this.mensajeLogin = 'Credenciales incorrectas';
          this.colorMensaje = 'red';
          this.showError('Usuario o contraseña incorrectos');

          // Bloquear después de 3 intentos
          if (this.loginAttempts >= this.maxAttempts) {
            this.blockUser();
          }
        }
        this.loading = false;
      },
      error: (error) => {
        this.loading = false;
        this.mensajeLogin = 'Credenciales incorrectas';
        this.colorMensaje = 'red';
        this.showError('Usuario o contraseña incorrectos');
        console.error('Error en login:', error);
      }
    });
  }

  ngOnDestroy(): void {
    this.removeBodyClass();
    if (this.themeListener) {
      window.removeEventListener('storage', this.themeListener);
    }
  }

  ngOnInit(): void {
    this.loadTheme();
    this.addBodyClass();
    this.setupThemeListener();


    // Verificar si ya está logueado
    const usuarioId = localStorage.getItem('usuario_id');
    if (usuarioId) {
      const usuarioTipo = localStorage.getItem('usuario_tipo');
      if (usuarioTipo === '1') {
        this.router.navigate(['/home']);
      } else {
        this.router.navigate(['/estudiantes']);
      }
    }
  }

  goToForgotPassword(): void {
    this.router.navigate(['/forgot-password']);
  }

  // Método para navegar según el tipo de usuario
  private navigateToUserHome(tipousuarioid: number): void {
    if (tipousuarioid === 1) {
      this.router.navigate(['/home']);
    } else {
      this.router.navigate(['/estudiantes']);
    }
  }

  // Métodos para manejar el modal de términos
  onTermsAccepted(): void {
    this.showTermsModal = false;
    // Navegar después de aceptar los términos
    const usuarioTipo = localStorage.getItem('usuario_tipo');
    const tipousuarioid = usuarioTipo ? parseInt(usuarioTipo) : 1;
    this.navigateToUserHome(tipousuarioid);
  }

  onTermsRejected(): void {
    this.showTermsModal = false;
    // Cerrar sesión si rechaza los términos
    localStorage.removeItem('usuario_id');
    localStorage.removeItem('usuario_tipo');
    localStorage.removeItem('userData');
    this.mensajeLogin = 'Debes aceptar los términos y condiciones y la política de privacidad para continuar';
    this.colorMensaje = 'red';
  }
}
