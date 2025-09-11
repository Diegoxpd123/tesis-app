import { Component, Input, Output, EventEmitter, OnInit, OnChanges, SimpleChanges } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PaginacionConfig } from '../../models/estudiante.model';

@Component({
  selector: 'app-estudiante-pagination',
  templateUrl: './estudiante-pagination.component.html',
  styleUrls: ['./estudiante-pagination.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class EstudiantePaginationComponent implements OnInit, OnChanges {
  @Input() config: PaginacionConfig = {
    pageSize: 5,
    currentPage: 1,
    totalItems: 0
  };
  @Input() isDarkMode: boolean = false;

  @Output() pageChange = new EventEmitter<number>();

  pages: number[] = [];
  showFirstEllipsis: boolean = false;
  showLastEllipsis: boolean = false;

  ngOnInit(): void {
    this.loadTheme();
    this.calculatePages();
  }

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['config']) {
      this.calculatePages();
    }
  }

  private loadTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode = savedTheme === 'dark';
  }

  get totalPages(): number {
    return Math.ceil(this.config.totalItems / this.config.pageSize);
  }

  get hasNextPage(): boolean {
    return this.config.currentPage < this.totalPages;
  }

  get hasPreviousPage(): boolean {
    return this.config.currentPage > 1;
  }

  get startItem(): number {
    return (this.config.currentPage - 1) * this.config.pageSize + 1;
  }

  get endItem(): number {
    const end = this.config.currentPage * this.config.pageSize;
    return Math.min(end, this.config.totalItems);
  }

  goToPage(page: number): void {
    if (page >= 1 && page <= this.totalPages && page !== this.config.currentPage) {
      this.pageChange.emit(page);
    }
  }

  goToFirstPage(): void {
    this.goToPage(1);
  }

  goToLastPage(): void {
    this.goToPage(this.totalPages);
  }

  goToNextPage(): void {
    this.goToPage(this.config.currentPage + 1);
  }

  goToPreviousPage(): void {
    this.goToPage(this.config.currentPage - 1);
  }

  private calculatePages(): void {
    const current = this.config.currentPage;
    const total = this.totalPages;

    this.pages = [];
    this.showFirstEllipsis = false;
    this.showLastEllipsis = false;

    if (total <= 7) {
      // Mostrar todas las páginas si son 7 o menos
      for (let i = 1; i <= total; i++) {
        this.pages.push(i);
      }
    } else {
      // Lógica para mostrar páginas con elipsis
      if (current <= 4) {
        // Cerca del inicio
        for (let i = 1; i <= 5; i++) {
          this.pages.push(i);
        }
        this.pages.push(total);
        this.showLastEllipsis = true;
      } else if (current >= total - 3) {
        // Cerca del final
        this.pages.push(1);
        this.showFirstEllipsis = true;
        for (let i = total - 4; i <= total; i++) {
          this.pages.push(i);
        }
      } else {
        // En el medio
        this.pages.push(1);
        this.showFirstEllipsis = true;
        for (let i = current - 1; i <= current + 1; i++) {
          this.pages.push(i);
        }
        this.showLastEllipsis = true;
        this.pages.push(total);
      }
    }
  }

  getPageNumbers(): number[] {
    return this.pages;
  }
}
