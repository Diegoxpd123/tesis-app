import { Component, Input, Output, EventEmitter, OnInit } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { ChatGptService } from '../../services/chat-gpt.service';

export interface Message {
  role: string;
  content: string;
}

@Component({
  selector: 'app-chat-gpt',
  templateUrl: './chat-gpt.component.html',
  styleUrls: ['./chat-gpt.component.scss'],
  standalone: true,
  imports: [CommonModule, FormsModule]
})
export class ChatGptComponent implements OnInit {
  @Input() messages: Message[] = [];
  @Input() isListening: boolean = false;
  @Input() showChat: boolean = false;

  @Output() messageSent = new EventEmitter<string>();
  @Output() startListening = new EventEmitter<void>();
  @Output() closeChat = new EventEmitter<void>();

  userMessage: string = '';
  private palabrasProhibidas: string[] = [
    'puta', 'mierda', 'estúpido', 'imbécil', 'idiota', 'perra', 'hijo de', 'maldito', 'conchudo', 'csm', 'hdp'
  ];

  constructor(private chatGptService: ChatGptService) {}

  ngOnInit(): void {}

  sendMessage(): void {
    if (!this.userMessage.trim()) return;

    const userMsg = this.userMessage.trim();

    // Verificar palabras ofensivas
    const contieneMalaPalabra = this.palabrasProhibidas.some(palabra =>
      userMsg.toLowerCase().includes(palabra)
    );

    if (contieneMalaPalabra) {
      this.messages.push({
        role: 'assistant',
        content: '⚠️ Por favor, evita el uso de lenguaje ofensivo.'
      });
      this.userMessage = '';
      return;
    }

    this.messageSent.emit(userMsg);
    this.userMessage = '';
  }

  onStartListening(): void {
    this.startListening.emit();
  }

  onCloseChat(): void {
    this.closeChat.emit();
  }

  onKeyPress(event: KeyboardEvent): void {
    if (event.key === 'Enter') {
      this.sendMessage();
    }
  }
}
