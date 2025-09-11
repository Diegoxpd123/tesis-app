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
  userType: string = '';
  currentUser: Usuario | null = null;
  isMobileMenuOpen: boolean = false;
  currentRoute: string = '';
  isDarkMode: boolean = false;
  showLogoutModal: boolean = false; // Modal de confirmación de cerrar sesión

  constructor(
    private comunicacionService: ComunicacionService,
    private usuarioService: UsuarioService,
    private router: Router
  ) {}

  ngOnInit(): void {
    this.checkUserType();
    this.trackCurrentRoute();
    this.loadTheme();
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
          // Solo mostrar botones para estudiantes (tipousuarioid === 1)
          const isStudent = usuario.tipousuarioid === 1;
          this.showProgressButton = isStudent;
          this.showHomeButton = isStudent;
          console.log('Usuario tipo:', usuario.tipousuarioid, 'Es estudiante:', isStudent, 'Mostrar botón inicio:', this.showHomeButton);
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
