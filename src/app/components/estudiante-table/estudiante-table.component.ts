import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { RouterModule } from '@angular/router';
import { Estudiante } from '../../models/estudiante.model';

@Component({
  selector: 'app-estudiante-table',
  templateUrl: './estudiante-table.component.html',
  styleUrls: ['./estudiante-table.component.scss'],
  standalone: true,
  imports: [CommonModule, RouterModule]
})
export class EstudianteTableComponent implements OnInit {
  @Input() estudiantes: Estudiante[] = [];
  @Input() loading: boolean = false;
  @Input() emptyMessage: string = 'No hay estudiantes disponibles';
  @Input() isDarkMode: boolean = false;
  @Input() showProgressColumns: boolean = true; // Para ocultar progreso y estado para admins

  @Output() verDetalles = new EventEmitter<number>();

  hoveredRow: number | null = null;

  ngOnInit(): void {
    this.loadTheme();
  }

  private loadTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode = savedTheme === 'dark';
  }

  onVerDetalles(estudianteId: number): void {
    this.verDetalles.emit(estudianteId);
  }

  onRowHover(estudianteId: number | null): void {
    this.hoveredRow = estudianteId;
  }

  getProgressColor(porcentaje: number): string {
    if (porcentaje >= 80) return '#10b981'; // Verde
    if (porcentaje >= 60) return '#f59e0b'; // Amarillo
    if (porcentaje >= 40) return '#f97316'; // Naranja
    return '#ef4444'; // Rojo
  }

  getProgressIcon(porcentaje: number): string {
    if (porcentaje >= 80) return '🎉';
    if (porcentaje >= 60) return '👍';
    if (porcentaje >= 40) return '📚';
    return '💪';
  }

  getSeccionLetra(seccionId: number): string {
    switch (seccionId) {
      case 1: return 'A';
      case 2: return 'B';
      case 3: return 'C';
      default: return '?';
    }
  }

  getEstadoText(porcentaje: number): string {
    if (porcentaje >= 80) return 'Excelente';
    if (porcentaje >= 60) return 'Bueno';
    if (porcentaje >= 40) return 'Regular';
    return 'Necesita ayuda';
  }

  getEstadoClass(porcentaje: number): string {
    if (porcentaje >= 80) return 'excelente';
    if (porcentaje >= 60) return 'bueno';
    if (porcentaje >= 40) return 'regular';
    return 'ayuda';
  }

  getProgressWidth(porcentaje: number): string {
    return `${Math.min(porcentaje, 100)}%`;
  }

  isRowHovered(estudianteId: number): boolean {
    return this.hoveredRow === estudianteId;
  }

  trackByEstudianteId(index: number, estudiante: Estudiante): number {
    return estudiante.id;
  }
}
