import { Component, OnInit } from '@angular/core';
import { UsuarioService } from '../../services/usuario.service';
import { EvaluacionService } from '../../services/evaluacion.service';
import { PreguntaService } from '../../services/pregunta.service';
import { TemaService } from '../../services/tema.service';
import * as XLSX from 'xlsx';

@Component({
  selector: 'app-carga',
  standalone: false,
  templateUrl: './carga.component.html',
  styleUrls: ['./carga.component.scss']
})
export class CargaComponent implements OnInit {
  tituloMessage: string = 'Carga de contenido académico';
  isDarkMode: boolean = false;
  isLoading: boolean = false;
  excelResultMessage: string = '';
  showResult: boolean = false;
  preguntasGuardadas: number = 0;
  totalPreguntas: number = 0;
  usuarioActual: any = null;
  archivoSeleccionado: File | null = null;

  constructor(
    private usuarioService: UsuarioService,
    private evaluacionService: EvaluacionService,
    private preguntaService: PreguntaService,
    private temaService: TemaService
  ) { }

  ngOnInit(): void {
    this.loadTheme();
    this.setupThemeListener();
    this.loadUserData();
  }

  private loadTheme(): void {
    const savedTheme = localStorage.getItem('theme');
    this.isDarkMode = savedTheme === 'dark';
  }

  private setupThemeListener(): void {
    window.addEventListener('storage', () => {
      this.loadTheme();
    });
    setInterval(() => {
      const currentTheme = localStorage.getItem('theme');
      const shouldBeDark = currentTheme === 'dark';
      if (this.isDarkMode !== shouldBeDark) {
        this.loadTheme();
      }
    }, 100);
  }

  private loadUserData(): void {
    const usuarioId = localStorage.getItem('usuario_id');
    if (usuarioId) {
      this.usuarioService.getUsuario(Number(usuarioId)).subscribe(usuario => {
        this.usuarioActual = usuario;
      });
    }
  }

  // Método para seleccionar archivo
  onFileSelected(event: any): void {
    const archivo = event.target.files[0];
    if (archivo) {
      this.archivoSeleccionado = archivo;
      console.log('Archivo seleccionado:', archivo.name);
    }
  }

  // Método para formatear tamaño de archivo
  formatFileSize(bytes: number): string {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
  }

  // Método para cargar Excel (misma lógica que estudiante-list-refactored)
  async leerArchivoExcel(archivo: File): Promise<void> {
    if (!archivo) return;

    this.isLoading = true;
    this.showResult = false;
    this.preguntasGuardadas = 0;
    this.totalPreguntas = 0;

    const reader = new FileReader();
    reader.onload = async (e: any) => {
      const data = new Uint8Array(e.target.result);
      const workbook = XLSX.read(data, { type: 'array' });
      const nombreHoja = workbook.SheetNames[0];
      const hoja = workbook.Sheets[nombreHoja];
      const filas: any[][] = XLSX.utils.sheet_to_json(hoja, { header: 1 });
      const dataRows = filas.slice(1);
      this.totalPreguntas = dataRows.length;

      for (const fila of dataRows) {
        try {
          const curso = fila[0]?.toString().trim();
          const temaNombre = fila[1]?.toString().trim();
          const preguntaTexto = fila[2]?.toString().trim();
          const descripcion = fila[3]?.toString().trim();
          const opcion3 = fila[4]?.toString().trim();
          const opcion2 = fila[5]?.toString().trim();
          const opcion1 = fila[6]?.toString().trim();
          const opcion4 = fila[7]?.toString().trim();
          const imagen = "/assets/img/" + fila[8]?.toString().trim() + ".png";

          const fechaNumeroInicio = fila[9];
          const fechaNumeroFin = fila[10];
          const grado = fila[11]?.toString().trim();

          let fechainicio: string = '';
          let fechafin: string = '';

          if (!isNaN(fechaNumeroInicio)) {
            const fechaObj = XLSX.SSF.parse_date_code(fechaNumeroInicio);
            if (fechaObj) {
              const jsFecha = new Date(fechaObj.y, fechaObj.m - 1, fechaObj.d);
              fechainicio = jsFecha.toISOString().split('T')[0];
            }
          }

          if (!isNaN(fechaNumeroFin)) {
            const fechaObj = XLSX.SSF.parse_date_code(fechaNumeroFin);
            if (fechaObj) {
              const jsFecha = new Date(fechaObj.y, fechaObj.m - 1, fechaObj.d);
              fechafin = jsFecha.toISOString().split('T')[0];
            }
          }

          let cursoId = 3;
          if (curso == 'Matemática') cursoId = 1;
          else if (curso == 'Comunicacion') cursoId = 2;

          if (!temaNombre || !preguntaTexto) continue;

          // Crear o buscar tema
          const temas = (await this.temaService.getTemas().toPromise()) ?? [];
          const temaExistente = temas.find(t => t.nombre.trim().toLowerCase() === temaNombre.toLowerCase());

          let temaId: number;
          if (temaExistente) {
            console.log(`⚠️ Tema ya existe: ${temaNombre}`);
            temaId = temaExistente.id;
          } else {
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
            if (!temaCreado) continue;
            temaId = temaCreado.id;
            console.log(`✅ Tema creado: ${temaNombre}`);
          }

          // Crear o buscar evaluación
          const nombretotal = temaNombre.toLowerCase();
          const evaluaciones = (await this.evaluacionService.getEvaluacions().toPromise()) ?? [];
          const evaluacionExistente = evaluaciones.find(ev => ev.nombre.trim().toLowerCase() === nombretotal.toLowerCase());

          let evaluacionId: number;
          if (evaluacionExistente) {
            console.log(`⚠️ Evaluación ya existe: ${nombretotal}`);
            evaluacionId = evaluacionExistente.id;
          } else {
            const evaluacion = {
              id: 0,
              nombre: nombretotal,
              temaid: temaId,
              institucionid: cursoId,
              created_at: new Date().toISOString(),
              updated_at: new Date().toISOString(),
              is_deleted: 0,
              is_actived: 1,
              fechainicio,
              fechafin,
              grado: grado
            };
            const evaluacionCreada = await this.evaluacionService.createEvaluacion(evaluacion).toPromise();
            if (!evaluacionCreada) continue;
            evaluacionId = evaluacionCreada.id;
            console.log(`✅ Evaluación creada: ${nombretotal}`);
          }

          // Crear pregunta
          const pregunta = {
            id: 0,
            descripcion: preguntaTexto,
            evaluacionid: evaluacionId,
            imagen,
            respuesta: descripcion,
            opcion1,
            opcion2,
            opcion3,
            opcion4,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_deleted: 0,
            is_actived: 1
          };

          await this.preguntaService.createPregunta(pregunta).toPromise();
          this.preguntasGuardadas++;
          console.log(`✅ Pregunta ${this.preguntasGuardadas}/${this.totalPreguntas} creada: ${preguntaTexto}`);

        } catch (error) {
          console.error('❌ Error al procesar fila:', error);
        }
      }

      // Finalizar loading
      this.isLoading = false;
      this.showResult = true;
      this.excelResultMessage = `¡Proceso completado! Se guardaron ${this.preguntasGuardadas} preguntas de ${this.totalPreguntas} procesadas.`;
      console.log(`🎉 Proceso completado: ${this.preguntasGuardadas} preguntas guardadas de ${this.totalPreguntas} procesadas`);

      // Ocultar el mensaje después de 5 segundos
      setTimeout(() => {
        this.showResult = false;
      }, 5000);
    };

    reader.readAsArrayBuffer(archivo);
  }

  guardar(): void {
    if (!this.archivoSeleccionado) {
      console.warn('No hay archivo seleccionado');
      return;
    }

    console.log('Procesando archivo Excel...');
    this.leerArchivoExcel(this.archivoSeleccionado);
  }
}
