// src/app/services/comunicacion.service.ts
import { Injectable } from '@angular/core';
import { Subject } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class ComunicacionService {
  private toggleDetallesSource = new Subject<void>();
  private toggleHomeSource = new Subject<void>();
  private toggleCerrarSesionSource = new Subject<void>();
  toggleDetalles$ = this.toggleDetallesSource.asObservable();
  toggleCerrarSesion$ = this.toggleCerrarSesionSource.asObservable();
  toggleHome$ = this.toggleHomeSource.asObservable();

  emitirToggleDetalles() {
    this.toggleDetallesSource.next();
  }

  emitirToggleHome() {
    this.toggleHomeSource.next();
  }

   emitirToggleCerrarSesion() {
    this.toggleCerrarSesionSource.next();
  }
}
