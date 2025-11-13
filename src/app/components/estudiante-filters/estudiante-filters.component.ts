import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { EstudianteFiltro } from '../../models/estudiante.model';

@Component({
  selector: 'app-estudiante-filters',
  templateUrl: './estudiante-filters.component.html',
  styleUrls: ['./estudiante-filters.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class EstudianteFiltersComponent implements OnInit {
  @Input() grados: string[] = ['1', '2', '3', '4', '5', '6'];
  @Input() secciones: string[] = ['A', 'B', 'C'];
  @Input() filtro: EstudianteFiltro = { grado: null, seccion: null };
  @Input() isDarkMode: boolean = false;

  @Output() filtroChange = new EventEmitter<EstudianteFiltro>();

  showAdvancedFilters: boolean = false;
  sortBy: string = 'grado-progreso'; // Ordenar por grado y progreso
  sortOrder: 'asc' | 'desc' = 'desc';

  ngOnInit(): void {
    this.loadTheme();
  }

  private loadTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode = savedTheme === 'dark';
  }

  onGradoChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.filtro.grado = target.value || null;
    this.filtroChange.emit({
      ...this.filtro,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    });
  }

  onSeccionChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.filtro.seccion = target.value || null;
    this.filtroChange.emit({
      ...this.filtro,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    });
  }

  onSortChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.sortBy = target.value;
    this.emitSortChange();
  }

  onSortOrderChange(): void {
    this.sortOrder = this.sortOrder === 'asc' ? 'desc' : 'asc';
    this.emitSortChange();
  }

  private emitSortChange(): void {
    this.filtroChange.emit({
      ...this.filtro,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    });
  }

  clearFilters(): void {
    this.filtro = { grado: null, seccion: null };
    this.sortBy = 'grado-progreso';
    this.sortOrder = 'desc';
    this.filtroChange.emit({
      ...this.filtro,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    });
  }

  clearGrado(): void {
    this.filtro.grado = null;
    this.filtroChange.emit({
      ...this.filtro,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    });
  }

  clearSeccion(): void {
    this.filtro.seccion = null;
    this.filtroChange.emit({
      ...this.filtro,
      sortBy: this.sortBy,
      sortOrder: this.sortOrder
    });
  }

  toggleAdvancedFilters(): void {
    this.showAdvancedFilters = !this.showAdvancedFilters;
  }

  getSortIcon(): string {
    return this.sortOrder === 'asc' ? '↑' : '↓';
  }

  getSortLabel(): string {
    const labels: { [key: string]: string } = {
      'nombre': 'Nombre',
      'grado': 'Grado',
      'porcentaje': 'Progreso',
      'seccion': 'Sección',
      'grado-progreso': 'Grado y Progreso'
    };
    return labels[this.sortBy] || 'Nombre';
  }
}
