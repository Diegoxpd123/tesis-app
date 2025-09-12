import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class TermsPrivacyService {
  private termsAcceptedSubject = new BehaviorSubject<boolean>(false);
  private privacyAcceptedSubject = new BehaviorSubject<boolean>(false);

  public termsAccepted$: Observable<boolean> = this.termsAcceptedSubject.asObservable();
  public privacyAccepted$: Observable<boolean> = this.privacyAcceptedSubject.asObservable();

  constructor() {
    this.loadAcceptedStatus();
  }

  /**
   * Verifica si los términos y políticas ya fueron aceptados
   */
  areTermsAndPrivacyAccepted(): boolean {
    const termsAccepted = localStorage.getItem('termsAccepted') === 'true';
    const privacyAccepted = localStorage.getItem('privacyAccepted') === 'true';
    return termsAccepted && privacyAccepted;
  }

  /**
   * Verifica si es la primera vez que el usuario se loguea
   */
  isFirstLogin(): boolean {
    return !this.areTermsAndPrivacyAccepted();
  }

  /**
   * Marca los términos como aceptados
   */
  acceptTerms(): void {
    localStorage.setItem('termsAccepted', 'true');
    this.termsAcceptedSubject.next(true);
  }

  /**
   * Marca las políticas como aceptadas
   */
  acceptPrivacy(): void {
    localStorage.setItem('privacyAccepted', 'true');
    this.privacyAcceptedSubject.next(true);
  }

  /**
   * Marca ambos como aceptados (para cuando se aceptan juntos)
   */
  acceptBoth(): void {
    this.acceptTerms();
    this.acceptPrivacy();
  }

  /**
   * Carga el estado de aceptación desde localStorage
   */
  private loadAcceptedStatus(): void {
    const termsAccepted = localStorage.getItem('termsAccepted') === 'true';
    const privacyAccepted = localStorage.getItem('privacyAccepted') === 'true';

    this.termsAcceptedSubject.next(termsAccepted);
    this.privacyAcceptedSubject.next(privacyAccepted);
  }

  /**
   * Resetea la aceptación (útil para testing o cambios de políticas)
   */
  resetAcceptance(): void {
    localStorage.removeItem('termsAccepted');
    localStorage.removeItem('privacyAccepted');
    this.termsAcceptedSubject.next(false);
    this.privacyAcceptedSubject.next(false);
  }

  /**
   * Obtiene el estado actual de aceptación de términos
   */
  getTermsAccepted(): boolean {
    return this.termsAcceptedSubject.value;
  }

  /**
   * Obtiene el estado actual de aceptación de políticas
   */
  getPrivacyAccepted(): boolean {
    return this.privacyAcceptedSubject.value;
  }
}
