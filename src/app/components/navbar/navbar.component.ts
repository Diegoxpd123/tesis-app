// src/app/navbar/navbar.component.ts
import { Component } from '@angular/core';
import { ComunicacionService } from '../../services/comunicacion.service';

@Component({
  selector: 'app-navbar',
  standalone: false,
  templateUrl: './navbar.component.html',
  styleUrls: ['./navbar.component.scss']
})
export class NavbarComponent {
  constructor(private comunicacionService: ComunicacionService) {}

  emitirToggleDetalles() {
    this.comunicacionService.emitirToggleDetalles();
  }

  emitirToggleHome() {
    this.comunicacionService.emitirToggleHome();
  }

   emitirToggleCerrarSesion() {
    this.comunicacionService.emitirToggleCerrarSesion();
  }
}
