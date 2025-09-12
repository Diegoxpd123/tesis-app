import { Component, OnInit, OnDestroy, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Subject } from 'rxjs';
import { TermsPrivacyService } from '../../services/terms-privacy.service';

@Component({
  selector: 'app-terms-privacy-modal',
  standalone: true,
  imports: [CommonModule],
  templateUrl: './terms-privacy-modal.component.html',
  styleUrls: ['./terms-privacy-modal.component.scss']
})
export class TermsPrivacyModalComponent implements OnInit, OnDestroy {
  @Output() accepted = new EventEmitter<void>();
  @Output() rejected = new EventEmitter<void>();

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
    // Mostrar automáticamente el modal de términos al cargar
    this.showTermsModal = true;
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

  // Métodos para navegar entre modales
  goToPrivacy(): void {
    this.showTermsModal = false;
    this.showPrivacyModal = true;
  }

  goBackToTerms(): void {
    this.showPrivacyModal = false;
    this.showTermsModal = true;
  }

  // Métodos para aceptar términos
  acceptTerms(): void {
    this.termsPrivacyService.acceptTerms();
    this.goToPrivacy(); // Ir automáticamente a políticas de privacidad
  }

  acceptPrivacy(): void {
    this.termsPrivacyService.acceptPrivacy();
    this.showPrivacyModal = false;
    this.accepted.emit(); // Notificar que ambos fueron aceptados
  }

  // Método para aceptar ambos de una vez
  acceptBoth(): void {
    this.termsPrivacyService.acceptBoth();
    this.showTermsModal = false;
    this.showPrivacyModal = false;
    this.accepted.emit();
  }

  // Métodos para rechazar
  rejectTerms(): void {
    this.showTermsModal = false;
    this.rejected.emit();
  }

  rejectPrivacy(): void {
    this.showPrivacyModal = false;
    this.rejected.emit();
  }
}
