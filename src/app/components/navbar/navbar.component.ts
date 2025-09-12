// src/app/navbar/navbar.component.ts
import { Component, OnInit, OnDestroy } from '@angular/core';
import { Router, NavigationEnd } from '@angular/router';
import { ComunicacionService } from '../../services/comunicacion.service';
import { UsuarioService } from '../../services/usuario.service';
import { filter } from 'rxjs/operators';

interface Usuario {
  id: number;
  usuario: string;
  tipousuarioid: number;
  aludocenid: number;
  nombre?: string;
  email?: string;
}

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent implements OnInit, OnDestroy {
  showProgressButton: boolean = false;
  showHomeButton: boolean = false; // Agregar control para botón inicio
  showCargaButton: boolean = false; // Control para botón de carga
  showSesionesButton: boolean = false; // Control para botón de sesiones
  showRegisterButton: boolean = false; // Control para botón de registrar usuario
  userType: string = '';
  currentUser: Usuario | null = null;
  isMobileMenuOpen: boolean = false;
  currentRoute: string = '';
  isDarkMode: boolean = false;
  showLogoutModal: boolean = false; // Modal de confirmación de cerrar sesión
  isInExam: boolean = false; // Variable para detectar si está en examen

  constructor(
    private comunicacionService: ComunicacionService,
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkUserType();
    this.trackCurrentRoute();
    this.loadTheme();
    this.checkExamStatus();
  }

  ngOnDestroy(): void {
    // Cleanup si es necesario
  }

  private checkUserType(): void {
    const usuarioId = localStorage.getItem('usuario_id');
    if (usuarioId) {
      this.usuarioService.getUsuario(Number(usuarioId)).subscribe({
        next: (usuario) => {
          this.currentUser = usuario;
          this.userType = usuario.usuario;
          // Solo mostrar botones para estudiantes (tipousuarioid === 1) y si no está en examen
          const isStudent = usuario.tipousuarioid === 1;
          const isAdmin = usuario.tipousuarioid === 3; // Administrador
          this.showProgressButton = isStudent && !this.isInExam;
          this.showHomeButton = isStudent && !this.isInExam;
          this.showCargaButton = isAdmin && !this.isInExam;
          this.showSesionesButton = isAdmin && !this.isInExam;
          this.showRegisterButton = isAdmin && !this.isInExam;
          console.log('Usuario tipo:', usuario.tipousuarioid, 'Es estudiante:', isStudent, 'Es admin:', isAdmin, 'En examen:', this.isInExam, 'Mostrar botones:', this.showProgressButton);
        },
        error: (error) => {
          console.error('Error al obtener tipo de usuario:', error);
          this.showProgressButton = false;
          this.showHomeButton = false;
          this.currentUser = null;
        }
      });
    }
  }

  private checkExamStatus(): void {
    // Verificar si está en examen basado en variables del localStorage o estado de la aplicación
    const isExamActive = localStorage.getItem('isExamActive') === 'true';
    const isexamen = localStorage.getItem('isexamen') === '1';

    this.isInExam = isExamActive || isexamen;

    // Actualizar visibilidad de botones
    this.updateButtonVisibility();

    // Escuchar cambios en el estado del examen
    setInterval(() => {
      const currentExamStatus = localStorage.getItem('isExamActive') === 'true' || localStorage.getItem('isexamen') === '1';
      if (this.isInExam !== currentExamStatus) {
        this.isInExam = currentExamStatus;
        this.updateButtonVisibility();
      }
    }, 1000); // Verificar cada segundo
  }

  private updateButtonVisibility(): void {
    if (this.currentUser) {
      const isStudent = this.currentUser.tipousuarioid === 1;
      const isAdmin = this.currentUser.tipousuarioid === 3;
      this.showProgressButton = isStudent && !this.isInExam;
      this.showHomeButton = isStudent && !this.isInExam;
      this.showCargaButton = isAdmin && !this.isInExam;
      this.showSesionesButton = isAdmin && !this.isInExam;
    }
  }

  private trackCurrentRoute(): void {
    this.router.events
      .pipe(filter(event => event instanceof NavigationEnd))
      .subscribe((event: NavigationEnd) => {
        this.currentRoute = event.url;
      });
  }

  private loadTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode = savedTheme === 'dark';
    this.applyTheme();
  }


  private isDocente(usuario: any): boolean {
    // Verificar si es docente basado en el tipousuarioid o aludocenid
    return usuario.tipousuarioid === 2 || usuario.aludocenid > 0;
  }

  // Métodos de navegación
  emitirToggleDetalles() {
    this.comunicacionService.emitirToggleDetalles();
  }

  emitirToggleHome() {
    this.comunicacionService.emitirToggleHome();
  }

  emitirToggleCerrarSesion() {
    this.comunicacionService.emitirToggleCerrarSesion();
  }

  // Método para mostrar modal de cerrar sesión
  cerrarSesion(): void {
    this.showLogoutModal = true;
    this.closeMobileMenu(); // Cerrar menú móvil si está abierto
  }

  // Método para confirmar cerrar sesión
  confirmarCerrarSesion(): void {
    // Limpiar localStorage
    localStorage.removeItem('usuario_id');
    localStorage.removeItem('alumno_id');
    localStorage.removeItem('usuario_tipo');
    localStorage.removeItem('usuario_nombre');
    localStorage.removeItem('remembered_username');

    // Limpiar variables del componente
    this.currentUser = null;
    this.userType = '';
    this.showProgressButton = false;
    this.showHomeButton = false;

    // Cerrar modal
    this.showLogoutModal = false;

    // Redirigir al login
    this.router.navigate(['/login']);

    // Mostrar mensaje de confirmación
    console.log('Sesión cerrada exitosamente');
  }

  // Método para cancelar cerrar sesión
  cancelarCerrarSesion(): void {
    this.showLogoutModal = false;
  }

  // Métodos del menú móvil
  toggleMobileMenu(): void {
    this.isMobileMenuOpen = !this.isMobileMenuOpen;
  }

  closeMobileMenu(): void {
    this.isMobileMenuOpen = false;
  }


  // Métodos de tema
  toggleTheme(): void {
    this.isDarkMode = !this.isDarkMode;
    localStorage.setItem('theme', this.isDarkMode ? 'dark' : 'light');
    this.applyTheme();
  }

  private applyTheme(): void {
    if (this.isDarkMode) {
      document.body.classList.add('dark-theme');
    } else {
      document.body.classList.remove('dark-theme');
    }
  }

  // Métodos de navegación
  navigateTo(route: string): void {
    console.log('Navegando a:', route);
    this.router.navigate([route]).then(success => {
      console.log('Navegación exitosa:', success);
    }).catch(error => {
      console.error('Error en navegación:', error);
    });
    this.closeMobileMenu();
  }

  navigateToHome(): void {
    console.log('Recargando página...');
    window.location.reload();
    this.closeMobileMenu();
  }

  navigateToProgress(): void {
    console.log('Navegando al progreso del home...');
    this.router.navigate(['/home']).then(success => {
      console.log('Navegación exitosa a home:', success);
      // Usar hash para activar el progreso
      window.location.hash = 'progress';
    }).catch(error => {
      console.error('Error en navegación a home:', error);
    });
    this.closeMobileMenu();
  }

  navigateToCarga(): void {
    console.log('Navegando a carga de contenido...');
    this.router.navigate(['/carga']).then(success => {
      console.log('Navegación exitosa a carga:', success);
    }).catch(error => {
      console.error('Error en navegación a carga:', error);
    });
    this.closeMobileMenu();
  }

  navigateToSesiones(): void {
    console.log('Navegando a sesiones y tiempos...');
    this.router.navigate(['/estudiantes']).then(success => {
      console.log('Navegación exitosa a estudiantes:', success);
    }).catch(error => {
      console.error('Error en navegación a estudiantes:', error);
    });
    this.closeMobileMenu();
  }

  navigateToRegister(): void {
    console.log('Navegando a registrar usuario...');
    this.router.navigate(['/admin/registrar-usuario']).then(success => {
      console.log('Navegación exitosa a registrar usuario:', success);
    }).catch(error => {
      console.error('Error en navegación a registrar usuario:', error);
    });
    this.closeMobileMenu();
  }

  // Métodos de utilidad
  getUserDisplayName(): string {
    if (this.currentUser) {
      return this.currentUser.nombre || this.currentUser.usuario;
    }
    return 'Usuario';
  }

  getUserRole(): string {
    if (!this.currentUser) return '';

    if (this.currentUser.usuario === 'admin') return 'Administrador';
    if (this.isDocente(this.currentUser)) return 'Docente';
    return 'Estudiante';
  }

  getRouteTitle(): string {
    switch (this.currentRoute) {
      case '/home': return 'Inicio';
      case '/estudiantes': return 'Estudiantes';
      case '/estudiantes-refactored': return 'Lista de Estudiantes';
      default: return 'DREAN TEACH ME';
    }
  }
}
