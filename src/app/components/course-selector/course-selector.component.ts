import { Component, Input, Output, EventEmitter } from '@angular/core';
import { CommonModule } from '@angular/common';

export interface Course {
  id: number;
  name: string;
  icon: string;
  color: string;
}

@Component({
  selector: 'app-course-selector',
  templateUrl: './course-selector.component.html',
  styleUrls: ['./course-selector.component.scss'],
  standalone: true,
  imports: [CommonModule]
})
export class CourseSelectorComponent {
  @Input() showCourseButtons: boolean = false;
  @Input() showEvaluations: boolean = false;
  @Input() evaluations: any[] = [];
  @Input() selectedCourse: string = '';

  @Output() courseSelected = new EventEmitter<number>();
  @Output() evaluationSelected = new EventEmitter<number>();
  @Output() goBack = new EventEmitter<void>();

  courses: Course[] = [
    { id: 1, name: 'Matemáticas', icon: '🔢', color: 'math' },
    { id: 2, name: 'Comunicación', icon: '📚', color: 'communication' },
    { id: 3, name: 'Ciencias y Tecnologías', icon: '🔬', color: 'science' }
  ];

  onCourseClick(courseId: number): void {
    this.courseSelected.emit(courseId);
  }

  onEvaluationChange(event: any): void {
    const evaluationId = +event.target.value;
    if (evaluationId) {
      this.evaluationSelected.emit(evaluationId);
    }
  }

  onGoBack(): void {
    this.goBack.emit();
  }
}
