import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule, DecimalPipe } from '@angular/common';
import { SpeechService } from '../../services/speech.service';

@Component({
  selector: 'app-robot',
  templateUrl: './robot.component.html',
  styleUrls: ['./robot.component.scss'],
  standalone: true,
  imports: [CommonModule, DecimalPipe]
})
export class RobotComponent implements OnInit {
  @Input() message: string = '';
  @Input() showTimer: boolean = false;
  @Input() timerMinutes: number = 0;
  @Input() timerSeconds: number = 0;
  @Input() showQuestion: boolean = false;
  @Input() questionImage: string = '';
  @Input() imageValid: boolean = true;

  @Output() imageError = new EventEmitter<void>();
  @Output() speakComplete = new EventEmitter<void>();

  constructor(private speechService: SpeechService) {}

  ngOnInit(): void {
    if (this.message) {
      this.speakMessage(this.message);
    }
  }

  ngOnChanges(): void {
    if (this.message) {
      this.speakMessage(this.message);
    }
  }

  speakMessage(message: string): void {
    this.speechService.speak(message).then(() => {
      this.speakComplete.emit();
    });
  }

  onImageError(): void {
    this.imageError.emit();
  }
}
