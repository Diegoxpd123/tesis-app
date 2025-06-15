import { Component, OnInit } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { ChatGptService } from '../../services/chat-gpt.service';
import { ComunicacionService } from '../../services/comunicacion.service';
import { ActivatedRoute, Router } from '@angular/router';
import { Chart, registerables } from 'chart.js';
import ChartDataLabels from 'chartjs-plugin-datalabels';
Chart.register(...registerables);
Chart.register(...registerables, ChartDataLabels);

@Component({
  selector: 'app-estudiante-detail',
  standalone: false,
  templateUrl: './estudiante-detail.component.html',
  styleUrl: './estudiante-detail.component.scss'
})
export class EstudianteDetailComponent implements OnInit {

   ngOnInit(): void {

  }


  ngAfterViewInit(): void {
    const ctx = document.getElementById('radarChart') as HTMLCanvasElement;

    new Chart(ctx, {
      type: 'radar',
      data: {
        labels: ['Matemáticas', 'Comunicación', 'Ciencias y Tecnología'],
        datasets: [{
          label: 'Progreso',
          data: [8, 10, 8], // Usa tus valores reales aquí
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
            ticks: {
              display: false
            }
          }
        }
      },
      plugins: [ChartDataLabels]
    });
  }

}
