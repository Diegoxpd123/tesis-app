import { Injectable } from '@angular/core';
import { Observable, from } from 'rxjs';
import * as XLSX from 'xlsx';
import { ExcelData, ExcelProcessResult } from '../models/estudiante.model';
import { TemaService } from './tema.service';
import { EvaluationService } from './evaluation.service';
import { QuestionService } from './question.service';

@Injectable({
  providedIn: 'root'
})
export class ExcelService {
  constructor(
    private temaService: TemaService,
    private evaluacionService: EvaluationService,
    private preguntaService: QuestionService
  ) {}

  async processExcelFile(file: File): Promise<ExcelProcessResult> {
    const result: ExcelProcessResult = {
      success: false,
      message: '',
      processedRows: 0,
      errors: []
    };

    try {
      const data = await this.readFileAsArrayBuffer(file);
      const workbook = XLSX.read(data, { type: 'array' });
      const nombreHoja = workbook.SheetNames[0];
      const hoja = workbook.Sheets[nombreHoja];
      const filas: any[][] = XLSX.utils.sheet_to_json(hoja, { header: 1 });
      const dataRows = filas.slice(1);

      let processedRows = 0;
      const errors: string[] = [];

      for (const [index, fila] of dataRows.entries()) {
        try {
          const excelData = this.parseExcelRow(fila);
          if (excelData) {
            await this.processExcelRow(excelData);
            processedRows++;
          }
        } catch (error) {
          const errorMsg = `Error en fila ${index + 2}: ${error}`;
          errors.push(errorMsg);
          console.error(errorMsg, error);
        }
      }

      result.success = true;
      result.processedRows = processedRows;
      result.errors = errors;
      result.message = `Procesadas ${processedRows} filas exitosamente. ${errors.length} errores encontrados.`;

    } catch (error) {
      result.success = false;
      result.message = `Error al procesar el archivo: ${error}`;
      result.errors = [result.message];
    }

    return result;
  }

  private readFileAsArrayBuffer(file: File): Promise<ArrayBuffer> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e: any) => resolve(e.target.result);
      reader.onerror = reject;
      reader.readAsArrayBuffer(file);
    });
  }

  private parseExcelRow(fila: any[]): ExcelData | null {
    const curso = fila[0]?.toString().trim();
    const temaNombre = fila[1]?.toString().trim();
    const preguntaTexto = fila[2]?.toString().trim();

    if (!temaNombre || !preguntaTexto) {
      return null;
    }

    return {
      curso: curso || '',
      temaNombre,
      preguntaTexto,
      descripcion: fila[3]?.toString().trim() || '',
      opcion1: fila[4]?.toString().trim() || '',
      opcion2: fila[5]?.toString().trim() || '',
      opcion3: fila[6]?.toString().trim() || '',
      opcion4: fila[7]?.toString().trim() || '',
      imagen: "/assets/img/" + (fila[8]?.toString().trim() || '') + ".png",
      fechaInicio: fila[9] || 0,
      fechaFin: fila[10] || 0,
      grado: fila[11]?.toString().trim() || ''
    };
  }

  private async processExcelRow(data: ExcelData): Promise<void> {
    const cursoId = this.getCursoId(data.curso);
    const temaId = await this.getOrCreateTema(data.temaNombre, cursoId);
    const evaluacionId = await this.getOrCreateEvaluacion(data, temaId);
    await this.createPregunta(data, evaluacionId);
  }

  private getCursoId(curso: string): number {
    switch (curso) {
      case 'Matemática': return 1;
      case 'Comunicacion': return 2;
      default: return 3;
    }
  }

  private async getOrCreateTema(temaNombre: string, cursoId: number): Promise<number> {
    const temas = await this.temaService.getTemas().toPromise() ?? [];
    const temaExistente = temas.find(t => t.nombre.trim().toLowerCase() === temaNombre.toLowerCase());

    if (temaExistente) {
      console.log(`⚠️ Tema ya existe: ${temaNombre}`);
      return temaExistente.id;
    }

    const tema = {
      id: 0,
      nombre: temaNombre,
      cursoid: cursoId,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: 0,
      is_actived: 1
    };

    const temaCreado = await this.temaService.createTema(tema).toPromise();
    if (!temaCreado) {
      throw new Error(`No se pudo crear el tema: ${temaNombre}`);
    }

    console.log(`✅ Tema creado: ${temaNombre}`);
    return temaCreado.id;
  }

  private async getOrCreateEvaluacion(data: ExcelData, temaId: number): Promise<number> {
    const evaluaciones = await this.evaluacionService.getEvaluacions().toPromise() ?? [];
    const evaluacionExistente = evaluaciones.find((ev: any) =>
      ev.nombre.trim().toLowerCase() === data.temaNombre.toLowerCase()
    );

    if (evaluacionExistente) {
      console.log(`⚠️ Evaluación ya existe: ${data.temaNombre}`);
      return evaluacionExistente.id;
    }

    const fechainicio = this.formatDate(data.fechaInicio);
    const fechafin = this.formatDate(data.fechaFin);

    const evaluacion = {
      id: 0,
      nombre: data.temaNombre.toLowerCase(),
      temaid: temaId,
      institucionid: this.getCursoId(data.curso),
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: 0,
      is_actived: 1,
      fechainicio,
      fechafin,
      grado: Number(data.grado) || 5
    };

    const evaluacionCreada = await this.evaluacionService.createEvaluacion(evaluacion).toPromise();
    if (!evaluacionCreada) {
      throw new Error(`No se pudo crear la evaluación: ${data.temaNombre}`);
    }

    console.log(`✅ Evaluación creada: ${data.temaNombre}`);
    return evaluacionCreada.id;
  }

  private async createPregunta(data: ExcelData, evaluacionId: number): Promise<void> {
    const pregunta = {
      id: 0,
      descripcion: data.preguntaTexto,
      evaluacionid: evaluacionId,
      imagen: data.imagen,
      respuesta: data.descripcion,
      opcion1: data.opcion1,
      opcion2: data.opcion2,
      opcion3: data.opcion3,
      opcion4: data.opcion4,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString(),
      is_deleted: 0,
      is_actived: 1
    };

    await this.preguntaService.createPregunta(pregunta).toPromise();
    console.log(`✅ Pregunta creada: ${data.preguntaTexto}`);
  }

  private formatDate(fechaNumero: number): string {
    if (isNaN(fechaNumero)) return '';

    const fechaObj = XLSX.SSF.parse_date_code(fechaNumero);
    if (fechaObj) {
      const jsFecha = new Date(fechaObj.y, fechaObj.m - 1, fechaObj.d);
      return jsFecha.toISOString().split('T')[0];
    }
    return '';
  }
}
