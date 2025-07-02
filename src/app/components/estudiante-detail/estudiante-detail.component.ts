import { Component, OnInit } from '@angular/core';
import { UsuarioService } from '../../services/usuario.service';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
import * as XLSX from 'xlsx';

Chart.register(...registerables);
Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-estudiante-detail',
  standalone: false,
  templateUrl: './estudiante-detail.component.html',
  styleUrl: './estudiante-detail.component.scss'
})
export class EstudianteDetailComponent implements OnInit {
  resultados: { [cursoid: number]: any[] } = {};
  usuarioid: number = 25;

  fechainicio: string = '';
  fechafin: string = '';

  constructor(private usuarioService: UsuarioService) {}

  ngOnInit(): void {
    this.setSemanaActual();

    [1, 2, 3].forEach(cursoid => this.mostrarResultados(cursoid));
  }

   setSemanaActual() {
    const hoy = new Date();
    const dia = hoy.getDay(); // 0 (Domingo) - 6 (Sábado)

    // Calcular lunes
    const diffLunes = hoy.getDate() - dia + (dia === 0 ? -6 : 1);
    const lunes = new Date(hoy.setDate(diffLunes));
    const domingo = new Date(lunes);
    domingo.setDate(lunes.getDate() + 6);

    this.fechainicio = lunes.toISOString().substring(0, 10);
    this.fechafin = domingo.toISOString().substring(0, 10);
  }

  ngAfterViewInit(): void {
    const ctx = document.getElementById('radarChart') as HTMLCanvasElement;

    new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Matemáticas', 'Comunicación', 'Ciencias y Tecnología'],
        datasets: [{
          label: 'Progreso',
          data: [8, 10, 8],
          backgroundColor: 'rgba(25, 118, 210, 0.3)',
          borderColor: '#1976d2',
          pointBackgroundColor: '#1976d2',
          pointBorderColor: '#fff',
          pointHoverBackgroundColor: '#fff',
          pointHoverBorderColor: '#1976d2',
          borderWidth: 2
        }]
      },
      options: {
        responsive: true,
        plugins: {
          legend: { display: false },
          datalabels: {
            color: 'white',
            font: {
              weight: 'bold',
              size: 14
            },
            formatter: (value: number) => `${value}`
          }
        },
        scales: {
          r: {
            beginAtZero: true,
            suggestedMax: 15,
            grid: { color: 'rgba(255, 255, 255, 0.2)' },
            pointLabels: {
              color: 'white',
              font: {
                size: 14,
                family: 'Comic Sans MS'
              }
            },
            angleLines: { color: 'rgba(255, 255, 255, 0.2)' },
            ticks: { display: false }
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

  mostrarResultados(cursoid: number) {
    if (!this.fechainicio || !this.fechafin) {
      alert('Selecciona fechas válidas');
      return;
    }

    this.usuarioService.getResultadosCurso({
      cursoid: cursoid,
      usuarioid: this.usuarioid,
      fechainicio: this.fechainicio,
      fechafin: this.fechafin
    }).subscribe(data => {
      this.resultados[cursoid] = data;
    });
  }

  calcularPuntaje(cursoid: number): string {
  const datos = this.resultados[cursoid];
  if (!datos || datos.length === 0) return '0%';

  let totalBuenas = 0;
  let totalPreguntas = 0;


  datos.forEach((r) => {
    const partes = r.respuestas_buenas_sobre_totales.split('/');
    if (partes.length === 2) {
      totalBuenas += parseInt(partes[0], 10);
      totalPreguntas += parseInt(partes[1], 10);
    }
  });

  if (totalPreguntas === 0) return '0%';

  const porcentaje = (totalBuenas / totalPreguntas) * 100;
  return `${porcentaje.toFixed(1)}%`;
}


  exportarExcel(cursoid: number) {
    const data = this.resultados[cursoid];
    if (!data || data.length === 0) {
      alert('No hay datos para exportar.');
      return;
    }

    const worksheet: XLSX.WorkSheet = XLSX.utils.json_to_sheet(data);
    const workbook: XLSX.WorkBook = {
      Sheets: { [`Curso_${cursoid}`]: worksheet },
      SheetNames: [`Curso_${cursoid}`]
    };
    XLSX.writeFile(workbook, `resultados_curso_${cursoid}.xlsx`);
  }
}
