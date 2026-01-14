import { Component, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { UserData } from '../models';

@Component({
  selector: 'app-anamnesis-form',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="max-w-2xl mx-auto p-6 bg-surface rounded-2xl border border-gray-700 shadow-xl animate-fade-in">
      <div class="mb-8 text-center">
        <h2 class="text-3xl font-bold bg-gradient-to-r from-primary to-secondary bg-clip-text text-transparent">
          Configuração do Perfil
        </h2>
        <p class="text-gray-400 mt-2">Vamos criar o plano perfeito para você.</p>
      </div>

      <div class="space-y-8">
        <!-- Step 1: Bio -->
        <section class="space-y-4">
          <h3 class="text-xl font-semibold text-white border-b border-gray-700 pb-2 flex items-center">
            <span class="bg-primary/20 text-primary p-1 rounded mr-3 text-sm">01</span> Biometria
          </h3>
          <div class="grid grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Idade</label>
              <input type="number" [(ngModel)]="data.age" class="w-full bg-dark border border-gray-700 rounded-lg p-3 text-white focus:border-primary focus:ring-1 focus:ring-primary outline-none transition" placeholder="Ex: 30">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Gênero</label>
              <select [(ngModel)]="data.gender" class="w-full bg-dark border border-gray-700 rounded-lg p-3 text-white focus:border-primary outline-none">
                <option value="Masculino">Masculino</option>
                <option value="Feminino">Feminino</option>
                <option value="Outro">Outro</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Peso (kg)</label>
              <input type="number" [(ngModel)]="data.weight" class="w-full bg-dark border border-gray-700 rounded-lg p-3 text-white focus:border-primary outline-none" placeholder="Ex: 75">
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Altura (cm)</label>
              <input type="number" [(ngModel)]="data.height" class="w-full bg-dark border border-gray-700 rounded-lg p-3 text-white focus:border-primary outline-none" placeholder="Ex: 175">
            </div>
          </div>
        </section>

        <!-- Step 2: Training -->
        <section class="space-y-4">
          <h3 class="text-xl font-semibold text-white border-b border-gray-700 pb-2 flex items-center">
            <span class="bg-primary/20 text-primary p-1 rounded mr-3 text-sm">02</span> Treino
          </h3>
          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Nível de Experiência</label>
              <select [(ngModel)]="data.level" class="w-full bg-dark border border-gray-700 rounded-lg p-3 text-white focus:border-primary outline-none">
                <option value="Sedentário">Sedentário</option>
                <option value="Iniciante (<6 meses)">Iniciante (&lt;6 meses)</option>
                <option value="Intermediário (6m-2a)">Intermediário (6m-2a)</option>
                <option value="Avançado (>2 anos)">Avançado (&gt;2 anos)</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Já fez musculação?</label>
              <select [(ngModel)]="data.experience" class="w-full bg-dark border border-gray-700 rounded-lg p-3 text-white focus:border-primary outline-none">
                <option value="Sim">Sim</option>
                <option value="Não">Não</option>
              </select>
            </div>
            <div class="md:col-span-2">
              <label class="block text-sm font-medium text-gray-300 mb-1">Objetivo Principal</label>
               <select [(ngModel)]="data.goal" class="w-full bg-dark border border-gray-700 rounded-lg p-3 text-white focus:border-primary outline-none">
                <option value="Perda de Gordura">Perda de Gordura</option>
                <option value="Hipertrofia (Ganhar massa)">Hipertrofia</option>
                <option value="Força Pura">Força Pura</option>
                <option value="Resistência/Condicionamento">Resistência</option>
                <option value="Manutenção e Saúde">Manutenção</option>
              </select>
            </div>
          </div>
        </section>

        <!-- Step 3: Logistics -->
        <section class="space-y-4">
          <h3 class="text-xl font-semibold text-white border-b border-gray-700 pb-2 flex items-center">
            <span class="bg-primary/20 text-primary p-1 rounded mr-3 text-sm">03</span> Logística
          </h3>
          <div class="grid grid-cols-2 gap-4">
             <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Dias/Semana</label>
              <select [(ngModel)]="data.daysAvailable" class="w-full bg-dark border border-gray-700 rounded-lg p-3 text-white focus:border-primary outline-none">
                <option [ngValue]="2">2 dias</option>
                <option [ngValue]="3">3 dias</option>
                <option [ngValue]="4">4 dias</option>
                <option [ngValue]="5">5 dias</option>
                <option [ngValue]="6">6 dias</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Tempo Disponível</label>
              <select [(ngModel)]="data.timeAvailable" class="w-full bg-dark border border-gray-700 rounded-lg p-3 text-white focus:border-primary outline-none">
                <option value="30 min">30 min</option>
                <option value="45 min">45 min</option>
                <option value="60 min">60 min</option>
                <option value="90 min+">90 min+</option>
              </select>
            </div>
            <div class="col-span-2">
              <label class="block text-sm font-medium text-gray-300 mb-1">Local de Treino</label>
              <select [(ngModel)]="data.location" class="w-full bg-dark border border-gray-700 rounded-lg p-3 text-white focus:border-primary outline-none">
                <option value="Academia Completa">Academia Completa</option>
                <option value="Academia de Condomínio (Básico)">Academia de Condomínio</option>
                <option value="Em Casa (Calistenia/Pesos Livres)">Em Casa / Calistenia</option>
              </select>
            </div>
          </div>
        </section>

        <!-- Step 4: Health & Nutrition -->
        <section class="space-y-4">
          <h3 class="text-xl font-semibold text-white border-b border-gray-700 pb-2 flex items-center">
            <span class="bg-primary/20 text-primary p-1 rounded mr-3 text-sm">04</span> Saúde e Dieta
          </h3>
          
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Lesões / Dores</label>
            <input type="text" [(ngModel)]="data.injuries" class="w-full bg-dark border border-gray-700 rounded-lg p-3 text-white focus:border-primary outline-none" placeholder="Ex: Dor no joelho direito, lombar...">
          </div>
          
          <div>
            <label class="block text-sm font-medium text-gray-300 mb-1">Condições Médicas</label>
            <input type="text" [(ngModel)]="data.conditions" class="w-full bg-dark border border-gray-700 rounded-lg p-3 text-white focus:border-primary outline-none" placeholder="Ex: Diabetes, Hipertensão...">
          </div>

          <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Orçamento Alimentar</label>
              <select [(ngModel)]="data.budget" class="w-full bg-dark border border-gray-700 rounded-lg p-3 text-white focus:border-primary outline-none">
                <option value="Econômico">Econômico (Barato)</option>
                <option value="Moderado">Moderado</option>
                <option value="Livre">Livre (Sem restrição)</option>
              </select>
            </div>
            <div>
              <label class="block text-sm font-medium text-gray-300 mb-1">Restrições Alimentares</label>
              <input type="text" [(ngModel)]="data.restrictions" class="w-full bg-dark border border-gray-700 rounded-lg p-3 text-white focus:border-primary outline-none" placeholder="Ex: Vegano, Sem glúten...">
            </div>
          </div>

           <div class="grid grid-cols-1 md:grid-cols-2 gap-4">
             <div>
               <label class="block text-sm font-medium text-gray-300 mb-1">Alimentos Favoritos</label>
               <input type="text" [(ngModel)]="data.likes" class="w-full bg-dark border border-gray-700 rounded-lg p-3 text-white focus:border-primary outline-none" placeholder="O que não pode faltar?">
             </div>
             <div>
               <label class="block text-sm font-medium text-gray-300 mb-1">Odeia Comer</label>
               <input type="text" [(ngModel)]="data.dislikes" class="w-full bg-dark border border-gray-700 rounded-lg p-3 text-white focus:border-primary outline-none" placeholder="O que evitar?">
             </div>
           </div>
        </section>

        <button 
          (click)="submit()" 
          [disabled]="!isValid()"
          class="w-full py-4 bg-gradient-to-r from-primary to-green-500 hover:from-green-400 hover:to-green-500 text-darker font-bold rounded-xl text-lg transition transform hover:scale-[1.02] disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-green-900/20">
          GERAR MEU PLANO TOTALFIT
        </button>

        @if (!isValid()) {
          <p class="text-center text-red-400 text-sm animate-pulse">Preencha idade, peso, altura e dias disponíveis para continuar.</p>
        }
      </div>
    </div>
  `
})
export class AnamnesisFormComponent {
  formSubmit = output<UserData>();

  data: UserData = {
    age: null,
    gender: 'Masculino',
    weight: null,
    height: null,
    level: 'Iniciante (<6 meses)',
    experience: 'Não',
    goal: 'Perda de Gordura',
    daysAvailable: 3,
    timeAvailable: '60 min',
    location: 'Academia Completa',
    injuries: '',
    conditions: '',
    restrictions: '',
    likes: '',
    dislikes: '',
    supplements: '',
    budget: 'Moderado'
  };

  isValid(): boolean {
    return !!(this.data.age && this.data.weight && this.data.height && this.data.daysAvailable);
  }

  submit() {
    if (this.isValid()) {
      this.formSubmit.emit(this.data);
    }
  }
}