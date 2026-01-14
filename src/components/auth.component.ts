import { Component, output, inject, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserProfile } from '../models';
import { StorageService } from '../services/storage.service';

@Component({
  selector: 'app-auth',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-md mx-auto mt-10 p-8 bg-surface rounded-2xl border border-gray-700 shadow-2xl animate-fade-in">
      
      <!-- Logo Area -->
      <div class="text-center mb-8">
        <div class="w-16 h-16 bg-gradient-to-tr from-primary to-blue-500 rounded-2xl flex items-center justify-center font-bold text-darker text-2xl mx-auto mb-4 transform rotate-3 shadow-lg shadow-primary/20">
          TF
        </div>
        <h2 class="text-3xl font-bold text-white">
          {{ isLoginMode() ? 'Bem-vindo de volta' : 'Crie sua conta' }}
        </h2>
        <p class="text-gray-400 mt-2">
          {{ isLoginMode() ? 'Acesse seus treinos salvos.' : 'Comece sua jornada fitness hoje.' }}
        </p>
      </div>

      <!-- Mode Switcher -->
      <div class="flex bg-dark rounded-lg p-1 mb-6 border border-gray-700">
        <button 
          (click)="setMode(true)" 
          class="flex-1 py-2 text-sm font-medium rounded-md transition"
          [class.bg-gray-700]="isLoginMode()"
          [class.text-white]="isLoginMode()"
          [class.text-gray-400]="!isLoginMode()">
          Entrar
        </button>
        <button 
          (click)="setMode(false)" 
          class="flex-1 py-2 text-sm font-medium rounded-md transition"
          [class.bg-gray-700]="!isLoginMode()"
          [class.text-white]="!isLoginMode()"
          [class.text-gray-400]="isLoginMode()">
          Cadastrar
        </button>
      </div>

      <!-- Form -->
      <form (submit)="onSubmit()" class="space-y-4">
        
        <!-- Name (Register Only) -->
        @if (!isLoginMode()) {
          <div class="animate-fade-in">
            <label class="block text-sm font-medium text-gray-300 mb-1">Seu Nome</label>
            <input 
              type="text" 
              [(ngModel)]="name" 
              name="name" 
              class="w-full bg-dark border border-gray-700 rounded-lg p-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition" 
              placeholder="Como devemos te chamar?">
          </div>
        }

        <!-- Email -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">E-mail</label>
          <input 
            type="email" 
            [(ngModel)]="email" 
            name="email" 
            required 
            class="w-full bg-dark border border-gray-700 rounded-lg p-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition" 
            [class.border-red-500]="emailTouched() && !isEmailValid()"
            (blur)="emailTouched.set(true)"
            placeholder="seu@email.com">
           @if(emailTouched() && !isEmailValid() && email.length > 0) {
             <p class="text-xs text-red-400 mt-1">Digite um e-mail válido.</p>
           }
        </div>

        <!-- Password -->
        <div>
          <label class="block text-sm font-medium text-gray-300 mb-1">Senha</label>
          <input 
            type="password" 
            [(ngModel)]="password" 
            name="password" 
            required 
            class="w-full bg-dark border border-gray-700 rounded-lg p-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition" 
            placeholder="******">
        </div>

        <!-- Remember Me Checkbox -->
        <div class="flex items-center">
          <input 
            id="remember-me" 
            type="checkbox" 
            [(ngModel)]="rememberMe" 
            name="rememberMe"
            class="w-4 h-4 rounded border-gray-700 bg-dark text-primary focus:ring-primary">
          <label for="remember-me" class="ml-2 block text-sm text-gray-400 select-none cursor-pointer">
            Lembrar-me neste dispositivo
          </label>
        </div>

        <!-- Error Message -->
        @if (errorMsg()) {
          <div class="p-3 bg-red-900/20 border border-red-900/50 rounded-lg text-red-400 text-sm flex items-center gap-2 animate-pulse">
            <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><line x1="12" x2="12" y1="8" y2="12"/><line x1="12" x2="12.01" y1="16" y2="16"/></svg>
            {{ errorMsg() }}
          </div>
        }

        <button 
          type="submit" 
          [disabled]="isLoading()"
          class="w-full py-3 bg-primary hover:bg-green-400 text-darker font-bold rounded-xl transition transform active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed mt-2">
          {{ isLoading() ? 'Carregando...' : (isLoginMode() ? 'Entrar' : 'Criar Conta Grátis') }}
        </button>
      </form>
      
      <p class="text-xs text-center text-gray-500 mt-6">
        Seus dados são criptografados localmente. Privacidade total.
      </p>
    </div>
  `
})
export class AuthComponent {
  private storage = inject(StorageService);
  loginSuccess = output<UserProfile>();

  isLoginMode = signal(true);
  isLoading = signal(false);
  errorMsg = signal('');
  
  // Validation State
  emailTouched = signal(false);

  name = '';
  email = '';
  password = '';
  rememberMe = false;

  setMode(isLogin: boolean) {
    this.isLoginMode.set(isLogin);
    this.errorMsg.set('');
    this.emailTouched.set(false);
  }

  isEmailValid(): boolean {
    const emailRegex = /^[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}$/;
    return emailRegex.test(this.email);
  }

  async onSubmit() {
    this.errorMsg.set('');
    
    // 1. Basic Empty Validation
    if (!this.email || !this.password) {
      this.errorMsg.set('Preencha todos os campos obrigatórios.');
      return;
    }

    if (!this.isLoginMode() && !this.name) {
      this.errorMsg.set('Por favor, informe seu nome.');
      return;
    }

    // 2. Format Validation
    if (!this.isEmailValid()) {
      this.errorMsg.set('O formato do e-mail é inválido.');
      this.emailTouched.set(true);
      return;
    }

    this.isLoading.set(true);

    // Simulate Network Request with artificial delay
    setTimeout(() => {
      try {
        let user: UserProfile;

        if (this.isLoginMode()) {
          user = this.storage.login(this.email, this.password, this.rememberMe);
        } else {
          user = this.storage.register(this.name, this.email, this.password, this.rememberMe);
        }

        this.loginSuccess.emit(user);

      } catch (err: any) {
        // 3. API/Business Logic Error Handling
        const message = err.message || 'Erro desconhecido ao conectar.';
        this.errorMsg.set(message);
        
        // Shake logic or specific handling could go here
      } finally {
        this.isLoading.set(false);
      }
    }, 1000);
  }
}