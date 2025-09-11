import { Component, Input, Output, EventEmitter, OnInit, HostListener } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ExcelProcessResult } from '../../models/estudiante.model';

@Component({
  selector: 'app-excel-uploader',
  templateUrl: './excel-uploader.component.html',
  styleUrls: ['./excel-uploader.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class ExcelUploaderComponent implements OnInit {
  @Input() showUploader: boolean = false;
  @Input() processing: boolean = false;
  @Input() result: ExcelProcessResult | null = null;
  @Input() isDarkMode: boolean = false;

  @Output() fileSelected = new EventEmitter<File>();
  @Output() toggleUploader = new EventEmitter<void>();

  isDragOver: boolean = false;
  selectedFile: File | null = null;
  uploadProgress: number = 0;

  ngOnInit(): void {
    this.loadTheme();
  }

  private loadTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode = savedTheme === 'dark';
  }

  @HostListener('dragover', ['$event'])
  onDragOver(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = true;
  }

  @HostListener('dragleave', ['$event'])
  onDragLeave(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;
  }

  @HostListener('drop', ['$event'])
  onDrop(event: DragEvent): void {
    event.preventDefault();
    event.stopPropagation();
    this.isDragOver = false;

    const files = event.dataTransfer?.files;
    if (files && files.length > 0) {
      this.handleFile(files[0]);
    }
  }

  onFileSelected(event: Event): void {
    const input = event.target as HTMLInputElement;
    if (input.files && input.files[0]) {
      this.handleFile(input.files[0]);
    }
  }

  private handleFile(file: File): void {
    // Validar tipo de archivo
    if (!this.isValidExcelFile(file)) {
      this.showError('Por favor selecciona un archivo Excel válido (.xlsx, .xls)');
      return;
    }

    // Validar tamaño
    if (file.size > 10 * 1024 * 1024) { // 10MB
      this.showError('El archivo es demasiado grande. Máximo 10MB');
      return;
    }

    this.selectedFile = file;
    this.simulateProgress();
    this.fileSelected.emit(file);
  }

  private isValidExcelFile(file: File): boolean {
    const validTypes = [
      'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
      'application/vnd.ms-excel'
    ];
    return validTypes.includes(file.type) ||
           file.name.toLowerCase().endsWith('.xlsx') ||
           file.name.toLowerCase().endsWith('.xls');
  }

  private simulateProgress(): void {
    this.uploadProgress = 0;
    const interval = setInterval(() => {
      this.uploadProgress += Math.random() * 30;
      if (this.uploadProgress >= 100) {
        this.uploadProgress = 100;
        clearInterval(interval);
      }
    }, 200);
  }

  private showError(message: string): void {
    // TODO: Implementar notificación de error
    console.error(message);
  }

  onToggleUploader(): void {
    this.toggleUploader.emit();
  }

  onRemoveFile(): void {
    this.selectedFile = null;
    this.uploadProgress = 0;
  }

  onRetry(): void {
    if (this.selectedFile) {
      this.fileSelected.emit(this.selectedFile);
    }
  }

  getResultIcon(): string {
    if (!this.result) return '';
    return this.result.success ? '✅' : '❌';
  }

  getResultClass(): string {
    if (!this.result) return '';
    return this.result.success ? 'success' : 'error';
  }

  getFileSize(file: File): string {
    const bytes = file.size;
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  getFileName(file: File): string {
    return file.name.length > 30 ? file.name.substring(0, 30) + '...' : file.name;
  }
}
