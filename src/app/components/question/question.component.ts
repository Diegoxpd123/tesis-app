import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Question {
  id: number;
  descripcion: string;
  opcion1: string;
  opcion2: string;
  opcion3: string;
  opcion4: string;
  respuesta: string;
  imagen?: string;
}

@Component({
  selector: 'app-question',
  templateUrl: './question.component.html',
  styleUrls: ['./question.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class QuestionComponent implements OnInit {
  @Input() question: Question | null = null;
  @Input() questionNumber: string = '';
  @Input() showImage: boolean = false;
  @Input() imageValid: boolean = true;

  @Output() answerSelected = new EventEmitter<string>();
  @Output() imageError = new EventEmitter<void>();

  shuffledOptions: string[] = [];

  ngOnInit(): void {
    if (this.question) {
      this.shuffleOptions();
    }
  }

  ngOnChanges(): void {
    if (this.question) {
      this.shuffleOptions();
    }
  }

  private shuffleOptions(): void {
    if (this.question) {
      this.shuffledOptions = [
        this.question.opcion1,
        this.question.opcion2,
        this.question.opcion3,
        this.question.opcion4
      ].sort(() => Math.random() - 0.5);
    }
  }

  onAnswerClick(answer: string): void {
    this.answerSelected.emit(answer);
  }

  onImageError(): void {
    this.imageError.emit();
  }
}
