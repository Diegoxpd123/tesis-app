export interface Estudiante {
  id: number;
  nombre: string;
  porcentaje: number;
  grado: number;
  seccionid: number;
}

export interface EstudianteFiltro {
  grado: string | null;
  seccion: string | null;
  sortBy?: string;
  sortOrder?: 'asc' | 'desc';
}

export interface PaginacionConfig {
  pageSize: number;
  currentPage: number;
  totalItems: number;
}

export interface ExcelData {
  curso: string;
  temaNombre: string;
  preguntaTexto: string;
  descripcion: string;
  opcion1: string;
  opcion2: string;
  opcion3: string;
  opcion4: string;
  imagen: string;
  fechaInicio: number;
  fechaFin: number;
  grado: string;
}

export interface ExcelProcessResult {
  success: boolean;
  message: string;
  processedRows: number;
  errors: string[];
}
