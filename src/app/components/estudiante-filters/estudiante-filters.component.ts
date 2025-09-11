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
  @Input() grados: string[] = ['4', '5', '6'];
  @Input() secciones: string[] = ['A', 'B', 'C'];
  @Input() filtro: EstudianteFiltro = { grado: null, seccion: null };
  @Input() isDarkMode: boolean = false;

  @Output() filtroChange = new EventEmitter<EstudianteFiltro>();

  showAdvancedFilters: boolean = false;
  sortBy: string = 'nombre';
  sortOrder: 'asc' | 'desc' = 'asc';

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
    this.filtroChange.emit(this.filtro);
  }

  onSeccionChange(event: Event): void {
    const target = event.target as HTMLSelectElement;
    this.filtro.seccion = target.value || null;
    this.filtroChange.emit(this.filtro);
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
    this.sortBy = 'nombre';
    this.sortOrder = 'asc';
    this.filtroChange.emit(this.filtro);
  }

  clearGrado(): void {
    this.filtro.grado = null;
    this.filtroChange.emit(this.filtro);
  }

  clearSeccion(): void {
    this.filtro.seccion = null;
    this.filtroChange.emit(this.filtro);
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
      'seccion': 'Sección'
    };
    return labels[this.sortBy] || 'Nombre';
  }
}
