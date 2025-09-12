import { Component, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { TermsPrivacyService } from '../../services/terms-privacy.service';

@Component({
  selector: 'app-footer',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './footer.component.html',
  styleUrls: ['./footer.component.scss']
})
export class FooterComponent implements OnInit, OnDestroy {
  private destroy$ = new Subject<void>();
  isDarkMode: boolean = false;
  private themeCheckInterval?: any;

  // Estados de los modales
  showTermsModal: boolean = false;
  showPrivacyModal: boolean = false;

  // Detectar si el usuario es administrador
  isAdmin: boolean = false;

  constructor(private termsPrivacyService: TermsPrivacyService) {}

  ngOnInit(): void {
    this.loadTheme();
    this.setupThemeListener();
    this.checkUserRole();
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
    this.themeCheckInterval = setInterval(() => {
      const currentTheme = localStorage.getItem('theme');
      const shouldBeDark = currentTheme === 'dark';
      if (this.isDarkMode !== shouldBeDark) {
        this.loadTheme();
      }
    }, 100);
  }

  private checkUserRole(): void {
    // Verificar si el usuario es administrador desde localStorage
    const userData = localStorage.getItem('userData');
    if (userData) {
      try {
        const user = JSON.parse(userData);
        // Verificar si el usuario es administrador (tipousuarioid = 3 o rol = 'admin')
        this.isAdmin = user.tipousuarioid === 3 || user.rol === 'admin' || user.tipousuarioid === '3';
      } catch (error) {
        console.error('Error parsing user data:', error);
        this.isAdmin = false;
      }
    }
  }

  // Métodos para abrir modales
  openTermsModal(): void {
    this.showTermsModal = true;
  }

  openPrivacyModal(): void {
    this.showPrivacyModal = true;
  }

  // Métodos para cerrar modales
  closeTermsModal(): void {
    this.showTermsModal = false;
  }

  closePrivacyModal(): void {
    this.showPrivacyModal = false;
  }

  // Métodos para aceptar términos
  acceptTerms(): void {
    this.showTermsModal = false;
    this.termsPrivacyService.acceptTerms();
  }

  acceptPrivacy(): void {
    this.showPrivacyModal = false;
    this.termsPrivacyService.acceptPrivacy();
  }
}
