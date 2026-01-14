import { Component, signal, inject, ElementRef, ViewChild, effect, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { GeminiService } from '../services/gemini.service';
import { ChatMessage, PlanResponse } from '../models';

@Component({
  selector: 'app-chat-bot',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <!-- Floating Button -->
    <button 
      (click)="toggleChat()"
      class="fixed bottom-6 right-6 w-14 h-14 bg-primary text-darker rounded-full shadow-lg shadow-primary/30 flex items-center justify-center z-50 hover:scale-110 transition-transform duration-200"
      [class.scale-0]="isOpen()">
      <svg xmlns="http://www.w3.org/2000/svg" width="28" height="28" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/></svg>
    </button>

    <!-- Chat Window -->
    <div 
      class="fixed bottom-6 right-6 w-[90vw] md:w-96 h-[500px] bg-surface border border-gray-700 rounded-2xl shadow-2xl z-50 flex flex-col overflow-hidden transition-all duration-300 origin-bottom-right"
      [class.scale-0]="!isOpen()"
      [class.opacity-0]="!isOpen()"
      [class.scale-100]="isOpen()"
      [class.opacity-100]="isOpen()">
      
      <!-- Header -->
      <div class="bg-gray-800 p-4 flex justify-between items-center border-b border-gray-700">
        <div class="flex items-center gap-3">
          <div class="w-10 h-10 bg-gradient-to-tr from-primary to-blue-500 rounded-full flex items-center justify-center font-bold text-darker text-sm">
            TF
          </div>
          <div>
            <h3 class="font-bold text-white text-sm">Coach TotalFit</h3>
            <p class="text-xs text-primary animate-pulse">Online</p>
          </div>
        </div>
        <button (click)="toggleChat()" class="text-gray-400 hover:text-white">
          <svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
        </button>
      </div>

      <!-- Messages Area -->
      <div #scrollContainer class="flex-grow p-4 overflow-y-auto space-y-4 bg-dark/50">
        @if (messages().length === 0) {
          <div class="text-center mt-10 text-gray-400 text-sm">
            <p>Olá! Eu sou seu Coach Virtual.</p>
            <p class="mt-2">Pergunte como fazer um exercício,<br>dúvidas sobre dieta ou peça dicas!</p>
            @if(currentPlan()) {
              <p class="mt-4 text-xs text-primary bg-primary/10 p-2 rounded inline-block">
                Estou sincronizado com seu plano atual.
              </p>
            }
          </div>
        }

        @for (msg of messages(); track $index) {
          <div [class]="'flex ' + (msg.role === 'user' ? 'justify-end' : 'justify-start')">
            <div 
              class="max-w-[85%] rounded-2xl px-4 py-2 text-sm leading-relaxed whitespace-pre-wrap"
              [class.bg-primary]="msg.role === 'user'"
              [class.text-darker]="msg.role === 'user'"
              [class.bg-gray-700]="msg.role === 'model'"
              [class.text-gray-100]="msg.role === 'model'"
              [innerHTML]="formatMessage(msg.text)">
            </div>
          </div>
        }

        @if (isThinking()) {
          <div class="flex justify-start">
            <div class="bg-gray-700 rounded-2xl px-4 py-3 flex gap-1 items-center">
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></span>
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-100"></span>
              <span class="w-2 h-2 bg-gray-400 rounded-full animate-bounce delay-200"></span>
            </div>
          </div>
        }
      </div>

      <!-- Input Area -->
      <form (submit)="sendMessage()" class="p-3 bg-gray-800 border-t border-gray-700 flex gap-2">
        <input 
          type="text" 
          [(ngModel)]="userInput" 
          name="message"
          placeholder="Ex: Como fazer o Supino?" 
          class="flex-grow bg-dark border border-gray-600 rounded-full px-4 py-2 text-sm text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none"
          autocomplete="off">
        <button 
          type="submit" 
          [disabled]="!userInput.trim() || isThinking()"
          class="w-10 h-10 bg-primary text-darker rounded-full flex items-center justify-center hover:bg-green-400 disabled:opacity-50 disabled:cursor-not-allowed transition">
          <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
        </button>
      </form>
    </div>
  `
})
export class ChatBotComponent {
  private geminiService = inject(GeminiService);
  
  currentPlan = input<PlanResponse | null>(null);
  isOpen = signal(false);
  isThinking = signal(false);
  messages = signal<ChatMessage[]>([]);
  userInput = '';

  @ViewChild('scrollContainer') private scrollContainer!: ElementRef;

  constructor() {
    // Auto-scroll effect
    effect(() => {
      this.messages(); // Dependency
      this.isThinking(); // Dependency
      setTimeout(() => this.scrollToBottom(), 100);
    });
  }

  toggleChat() {
    this.isOpen.update(v => !v);
  }

  async sendMessage() {
    if (!this.userInput.trim() || this.isThinking()) return;

    const text = this.userInput;
    this.userInput = '';

    // Add User Message
    this.messages.update(msgs => [...msgs, {
      role: 'user',
      text: text,
      timestamp: new Date()
    }]);

    this.isThinking.set(true);

    try {
      // Pass the current plan to the service
      const response = await this.geminiService.sendMessageToCoach(text, this.currentPlan());
      
      // Add Bot Message
      this.messages.update(msgs => [...msgs, {
        role: 'model',
        text: response,
        timestamp: new Date()
      }]);
    } catch (error) {
      console.error(error);
      this.messages.update(msgs => [...msgs, {
        role: 'model',
        text: 'Desculpe, tive um problema de conexão. Tente novamente.',
        timestamp: new Date()
      }]);
    } finally {
      this.isThinking.set(false);
    }
  }

  scrollToBottom() {
    if (this.scrollContainer) {
      this.scrollContainer.nativeElement.scrollTop = this.scrollContainer.nativeElement.scrollHeight;
    }
  }

  // Simple formatter to detect links (markdown style [text](url)) and make them clickable html
  formatMessage(text: string): string {
    // Regex for [Link Text](URL)
    const mdLinkRegex = /\[([^\]]+)\]\(([^)]+)\)/g;
    
    // Bold formatting **text**
    let formatted = text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>');
    
    // Links formatting
    formatted = formatted.replace(mdLinkRegex, (match, label, url) => {
      return `<a href="${url}" target="_blank" class="inline-flex items-center gap-1 font-bold text-blue-300 hover:text-blue-100 bg-blue-900/30 px-2 py-0.5 rounded border border-blue-800 hover:bg-blue-800 transition my-1">${label} ↗</a>`;
    });
    
    return formatted;
  }
}