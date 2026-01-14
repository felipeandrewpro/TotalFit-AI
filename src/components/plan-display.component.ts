import { Component, input, signal, output, effect } from '@angular/core';
import { CommonModule } from '@angular/common';
import { PlanResponse } from '../models';

@Component({
  selector: 'app-plan-display',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="max-w-4xl mx-auto pb-12 animate-fade-in-up">
      
      <!-- LOADING STATE -->
      @if (isLoading()) {
        <div class="flex flex-col items-center justify-center py-20 min-h-[50vh]">
          <!-- Style for local animation -->
          <style>
            @keyframes shimmer {
              0% { transform: translateX(-100%); }
              100% { transform: translateX(200%); }
            }
            .animate-progress-shimmer {
              animation: shimmer 1.5s infinite linear;
            }
            .fade-text {
              animation: fadeText 0.5s ease-in-out;
            }
            @keyframes fadeText {
              0% { opacity: 0; transform: translateY(5px); }
              100% { opacity: 1; transform: translateY(0); }
            }
          </style>

          <div class="relative w-24 h-24 mb-8">
            <div class="absolute inset-0 border-4 border-gray-700 rounded-full"></div>
            <div class="absolute inset-0 border-4 border-primary border-t-transparent rounded-full animate-spin"></div>
            <div class="absolute inset-0 flex items-center justify-center">
              <span class="text-2xl animate-pulse">⚡</span>
            </div>
          </div>
          
          <!-- Dynamic Message -->
          <h2 class="text-2xl font-bold text-white mb-2 h-8 flex items-center justify-center fade-text text-center">
            {{ currentMessage() }}
          </h2>
          
          <!-- PROGRESS BAR ANIMATION -->
          <div class="w-64 h-2 bg-gray-800 rounded-full mt-4 mb-4 overflow-hidden relative border border-gray-700 shadow-lg shadow-primary/10">
             <!-- Base fill -->
             <div class="absolute inset-0 bg-primary/20 w-full"></div>
             <!-- Moving shimmer -->
             <div class="absolute top-0 bottom-0 left-0 w-full bg-gradient-to-r from-transparent via-primary to-transparent opacity-75 animate-progress-shimmer"></div>
          </div>

          <p class="text-gray-400 text-sm text-center max-w-md animate-pulse">
            O TotalFit AI está processando seus dados biológicos para criar um plano 100% exclusivo.
          </p>
        </div>
      } 
      
      <!-- RESULT STATE -->
      @else if (plan()) {
        <div class="space-y-8 animate-fade-in">
          <!-- Action Bar -->
          <div class="flex justify-between items-center">
             <h2 class="text-2xl font-bold text-white">Seu Plano Gerado</h2>
             <div class="flex gap-2">
                @if (!isSaved()) {
                  <button (click)="onSave()" class="flex items-center gap-2 bg-green-600 hover:bg-green-500 text-white px-4 py-2 rounded-lg font-medium transition shadow-lg shadow-green-900/20 transform active:scale-95">
                    <span>💾 Salvar Plano</span>
                  </button>
                } @else {
                  <span class="flex items-center gap-2 text-green-400 bg-green-900/20 px-4 py-2 rounded-lg border border-green-900">
                    ✅ Salvo!
                  </span>
                }
             </div>
          </div>

          <!-- Summary Section -->
          <section class="bg-surface rounded-2xl p-6 border border-gray-700 shadow-xl overflow-hidden relative">
            <div class="absolute top-0 right-0 p-4 opacity-10">
              <svg class="w-32 h-32 text-primary" fill="currentColor" viewBox="0 0 20 20"><path fill-rule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zm1-12a1 1 0 10-2 0v4a1 1 0 00.293.707l2.828 2.829a1 1 0 101.415-1.415L11 9.586V6z" clip-rule="evenodd" /></svg>
            </div>
            <h2 class="text-2xl font-bold text-white mb-4 flex items-center gap-2">
              📊 Diagnóstico & Metas
            </h2>
            <p class="text-gray-300 mb-6 italic border-l-4 border-primary pl-4">"{{ plan()?.profile?.diagnosis }}"</p>
            
            <div class="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div class="bg-dark p-4 rounded-xl text-center border border-gray-700">
                <span class="block text-gray-400 text-xs uppercase tracking-wider">Calorias</span>
                <span class="text-2xl font-bold text-white">{{ plan()?.profile?.calories }}</span>
                <span class="text-xs text-gray-500">kcal</span>
              </div>
              <div class="bg-dark p-4 rounded-xl text-center border border-gray-700">
                 <span class="block text-gray-400 text-xs uppercase tracking-wider">Proteína</span>
                 <span class="text-2xl font-bold text-blue-400">{{ plan()?.profile?.macros?.protein }}g</span>
              </div>
              <div class="bg-dark p-4 rounded-xl text-center border border-gray-700">
                 <span class="block text-gray-400 text-xs uppercase tracking-wider">Carbo</span>
                 <span class="text-2xl font-bold text-yellow-400">{{ plan()?.profile?.macros?.carbs }}g</span>
              </div>
               <div class="bg-dark p-4 rounded-xl text-center border border-gray-700">
                 <span class="block text-gray-400 text-xs uppercase tracking-wider">Gordura</span>
                 <span class="text-2xl font-bold text-red-400">{{ plan()?.profile?.macros?.fats }}g</span>
              </div>
            </div>
            <div class="mt-4 text-center">
                <span class="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-blue-900/30 text-blue-400 border border-blue-800">
                  💧 Meta de Hidratação: {{ plan()?.profile?.hydration }} Litros/dia
                </span>
            </div>
          </section>

          <!-- Tabs -->
          <div class="flex flex-wrap gap-2 justify-center sticky top-2 z-20 bg-darker/80 backdrop-blur py-2">
            <button (click)="activeTab.set('workout')" [class]="activeTab() === 'workout' ? 'bg-primary text-darker' : 'bg-surface text-gray-300 hover:bg-gray-700'" class="px-6 py-2 rounded-full font-bold transition">Treino</button>
            <button (click)="activeTab.set('diet')" [class]="activeTab() === 'diet' ? 'bg-primary text-darker' : 'bg-surface text-gray-300 hover:bg-gray-700'" class="px-6 py-2 rounded-full font-bold transition">Dieta</button>
            <button (click)="activeTab.set('supplements')" [class]="activeTab() === 'supplements' ? 'bg-primary text-darker' : 'bg-surface text-gray-300 hover:bg-gray-700'" class="px-6 py-2 rounded-full font-bold transition">Suplementos</button>
            <button (click)="activeTab.set('shopping')" [class]="activeTab() === 'shopping' ? 'bg-primary text-darker' : 'bg-surface text-gray-300 hover:bg-gray-700'" class="px-6 py-2 rounded-full font-bold transition">Lista de Compras</button>
          </div>

          <!-- Workout Section -->
          @if (activeTab() === 'workout') {
            <div class="space-y-6 animate-fade-in">
              @for (day of plan()?.workout; track $index) {
                <div class="bg-surface rounded-xl overflow-hidden border border-gray-700">
                  <div class="bg-gray-800/50 p-4 border-b border-gray-700 flex justify-between items-center">
                    <h3 class="text-lg font-bold text-white">{{ day.day }}</h3>
                    <span class="text-sm bg-primary/20 text-primary px-3 py-1 rounded-full border border-primary/30">{{ day.focus }}</span>
                  </div>
                  <div class="p-4">
                     @if (day.cardio) {
                       <div class="mb-4 p-3 bg-blue-900/20 border border-blue-800 rounded-lg flex items-start gap-3">
                         <span class="text-2xl">🏃‍♂️</span>
                         <div>
                           <strong class="text-blue-300 block text-sm">Cardio</strong>
                           <p class="text-sm text-gray-300">{{ day.cardio }}</p>
                         </div>
                       </div>
                     }
                    
                    <div class="overflow-x-auto">
                      <table class="w-full text-left text-sm text-gray-300">
                        <thead class="text-xs uppercase bg-dark/50 text-gray-500">
                          <tr>
                            <th class="px-4 py-2 rounded-l-lg">Exercício</th>
                            <th class="px-4 py-2">Séries</th>
                            <th class="px-4 py-2">Reps</th>
                            <th class="px-4 py-2">Descanso</th>
                            <th class="px-4 py-2 rounded-r-lg">Dica</th>
                          </tr>
                        </thead>
                        <tbody class="divide-y divide-gray-700">
                          @for (exercise of day.exercises; track $index) {
                            <tr class="hover:bg-white/5 transition">
                              <td class="px-4 py-3 font-medium text-white">{{ exercise.name }}</td>
                              <td class="px-4 py-3">{{ exercise.sets }}</td>
                              <td class="px-4 py-3">{{ exercise.reps }}</td>
                              <td class="px-4 py-3">{{ exercise.rest }}</td>
                              <td class="px-4 py-3 text-xs text-gray-400 italic">{{ exercise.tip }}</td>
                            </tr>
                          }
                        </tbody>
                      </table>
                    </div>
                  </div>
                </div>
              } @empty {
                 <!-- Fallback Workout Content -->
                 <div class="bg-surface p-8 rounded-xl border border-gray-700 text-center">
                   <div class="text-4xl mb-4">🚶</div>
                   <h3 class="text-xl font-bold text-white mb-2">Recomendação Geral de Atividade</h3>
                   <p class="text-gray-400 mb-4 max-w-lg mx-auto">
                     Como não foi possível gerar um treino específico com os dados atuais, siga estas recomendações universais da OMS:
                   </p>
                   <ul class="text-left max-w-md mx-auto space-y-3 text-gray-300">
                     <li class="flex gap-2"><span class="text-primary">✓</span> 150 minutos de atividade moderada por semana.</li>
                     <li class="flex gap-2"><span class="text-primary">✓</span> Caminhadas rápidas de 30 minutos, 5x na semana.</li>
                     <li class="flex gap-2"><span class="text-primary">✓</span> Alongamento diário ao acordar.</li>
                   </ul>
                 </div>
              }
            </div>
          }

          <!-- Diet Section -->
          @if (activeTab() === 'diet') {
            <div class="grid grid-cols-1 md:grid-cols-2 gap-6 animate-fade-in">
              @for (meal of plan()?.diet; track $index) {
                <div class="bg-surface rounded-xl p-5 border border-gray-700 hover:border-primary/50 transition duration-300 flex flex-col h-full">
                  
                  <div class="flex-grow">
                    <h3 class="text-lg font-bold text-white mb-3 flex items-center gap-2">
                      <span class="w-2 h-8 bg-green-500 rounded-full"></span>
                      {{ meal.mealName }}
                    </h3>
                    <ul class="space-y-3 mb-4">
                      @for (item of meal.options; track $index) {
                        <li class="bg-dark/50 p-3 rounded-lg border border-gray-700/50">
                          <div class="flex justify-between items-start mb-1">
                            <strong class="text-green-300">{{ item.name }}</strong>
                            <span class="text-xs bg-gray-700 px-2 py-1 rounded text-gray-300">{{ item.quantity }}</span>
                          </div>
                          <div class="text-xs text-gray-500 mb-1">Medida: {{ item.measure }}</div>
                          @if (item.substitution) {
                            <div class="text-xs text-gray-400 italic border-t border-gray-700 mt-2 pt-1">
                              🔄 Troca: {{ item.substitution }}
                            </div>
                          }
                        </li>
                      }
                    </ul>
                  </div>

                  <!-- Chef's Tip Section -->
                  @if (meal.tips) {
                    <div class="mt-4 pt-4 border-t border-gray-700/50">
                      <div class="p-3 bg-yellow-500/10 border border-yellow-500/20 rounded-lg flex items-start gap-3">
                        <span class="text-xl">👩‍🍳</span>
                        <div>
                          <span class="text-yellow-500 text-xs font-bold uppercase tracking-wide block mb-1">Dica de Preparo</span>
                          <p class="text-sm text-gray-300 italic leading-relaxed">{{ meal.tips }}</p>
                        </div>
                      </div>
                    </div>
                  }
                </div>
              } @empty {
                <!-- Fallback Diet Content -->
                <div class="col-span-1 md:col-span-2 bg-surface p-8 rounded-xl border border-gray-700 text-center">
                   <div class="text-4xl mb-4">🍽️</div>
                   <h3 class="text-xl font-bold text-white mb-2">Princípios Nutricionais Básicos</h3>
                   <p class="text-gray-400 mb-4">Ainda não geramos um menu detalhado. Use a regra do "Prato Saudável":</p>
                   <div class="grid grid-cols-1 sm:grid-cols-3 gap-4 text-sm mt-6">
                     <div class="p-4 bg-dark rounded border border-gray-800">
                       <span class="block text-green-400 font-bold text-lg">50%</span>
                       Vegetais e Legumes
                     </div>
                     <div class="p-4 bg-dark rounded border border-gray-800">
                       <span class="block text-blue-400 font-bold text-lg">25%</span>
                       Proteínas Magras
                     </div>
                     <div class="p-4 bg-dark rounded border border-gray-800">
                       <span class="block text-yellow-400 font-bold text-lg">25%</span>
                       Carboidratos Integrais
                     </div>
                   </div>
                 </div>
              }
            </div>
          }

          <!-- Supplements Section -->
          @if (activeTab() === 'supplements') {
            <div class="animate-fade-in">
              <div class="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
                @for (supp of plan()?.supplements; track $index) {
                  <div class="bg-surface p-6 rounded-xl border border-gray-700 flex flex-col justify-between hover:border-primary/30 transition">
                    <div>
                      <div class="flex justify-between items-start mb-3">
                        <h3 class="text-xl font-bold text-white">{{ supp.name }}</h3>
                        <span class="bg-blue-900/30 text-blue-300 text-[10px] uppercase font-bold px-2 py-1 rounded border border-blue-800/50">Recomendado</span>
                      </div>
                      
                      <div class="mb-4">
                        <span class="text-xs text-gray-500 uppercase font-bold mb-1 block">Por que usar?</span>
                        <p class="text-gray-300 text-sm leading-relaxed border-l-2 border-primary pl-3">
                          {{ supp.reason }}
                        </p>
                      </div>
                    </div>
                    
                    <div class="bg-dark/50 p-3 rounded-lg border border-gray-700/50 flex items-center gap-3">
                      <div class="bg-primary/10 p-2 rounded-full text-primary">
                        <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M4 2v20"/><path d="M20 2v20"/><path d="m4 10 16-2"/><path d="m4 14 16 2"/></svg>
                      </div>
                      <div>
                        <span class="text-[10px] text-gray-500 uppercase font-bold block">Protocolo de Uso</span>
                        <p class="text-white font-mono text-sm">{{ supp.dosage }}</p>
                      </div>
                    </div>
                  </div>
                } @empty {
                   <!-- Fallback Supplements Content -->
                   <div class="col-span-2 text-center py-12 px-6 bg-surface rounded-xl border border-gray-700 border-dashed">
                     <span class="text-4xl mb-4 block">☀️</span>
                     <h3 class="text-xl font-bold text-white mb-2">Suplementação Natural</h3>
                     <p class="text-gray-400 max-w-lg mx-auto mb-4">
                       Seu plano não requer suplementos industrializados. Foque nos pilares biológicos:
                     </p>
                     <div class="flex justify-center gap-6 text-sm text-gray-300">
                        <span>💧 Água</span>
                        <span>😴 Sono (8h)</span>
                        <span>🧘 Controle de Estresse</span>
                     </div>
                   </div>
                }
              </div>

              <!-- Medical Disclaimer Footer -->
              <div class="bg-red-900/10 border border-red-900/30 rounded-lg p-4 flex gap-4 items-start">
                <div class="text-red-400 text-xl mt-1">⚠️</div>
                <div>
                  <h4 class="text-red-400 font-bold text-sm uppercase">Aviso Importante</h4>
                  <p class="text-xs text-gray-400 mt-1 leading-relaxed">
                    A suplementação sugerida é baseada em evidências científicas gerais para o seu objetivo. 
                    <strong>Sempre consulte um médico ou nutricionista</strong> antes de iniciar o uso de qualquer substância, especialmente se você possui condições preexistentes (cardíacas, renais, etc) ou faz uso de medicamentos controlados.
                  </p>
                </div>
              </div>
            </div>
          }

          <!-- Shopping List Section -->
          @if (activeTab() === 'shopping') {
            <div class="bg-surface rounded-xl p-8 border border-gray-700 animate-fade-in">
              <h3 class="text-xl font-bold text-white mb-6 flex items-center gap-2">
                🛒 Lista de Supermercado (Semanal)
              </h3>
              <p class="text-sm text-gray-400 mb-6">Itens calculados para seguir a dieta por 7 dias, respeitando seu orçamento.</p>
              
              <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  @for (item of plan()?.shoppingList; track $index) {
                    <div class="flex items-center gap-3 p-3 bg-dark/30 hover:bg-white/5 rounded-lg transition border border-gray-700/50">
                      <div class="w-2 h-2 rounded-full bg-primary flex-shrink-0"></div>
                      <span class="text-gray-300 text-sm">{{ item }}</span>
                    </div>
                  } @empty {
                    <!-- Fallback Shopping List Content -->
                    <div class="col-span-full text-center py-10 border border-gray-800 border-dashed rounded-lg bg-dark/30">
                       <p class="text-gray-400 mb-3">Lista personalizada não disponível. Itens essenciais sugeridos:</p>
                       <div class="flex flex-wrap justify-center gap-2">
                         <span class="bg-gray-800 px-3 py-1 rounded text-xs text-gray-300">Ovos</span>
                         <span class="bg-gray-800 px-3 py-1 rounded text-xs text-gray-300">Frango/Peixe</span>
                         <span class="bg-gray-800 px-3 py-1 rounded text-xs text-gray-300">Arroz/Batata</span>
                         <span class="bg-gray-800 px-3 py-1 rounded text-xs text-gray-300">Vegetais Verde-Escuros</span>
                         <span class="bg-gray-800 px-3 py-1 rounded text-xs text-gray-300">Frutas da Estação</span>
                         <span class="bg-gray-800 px-3 py-1 rounded text-xs text-gray-300">Azeite de Oliva</span>
                       </div>
                    </div>
                  }
              </div>
            </div>
          }
        </div>
      }

    </div>
  `
})
export class PlanDisplayComponent {
  plan = input<PlanResponse | null>(null);
  isLoading = input<boolean>(false);
  isSaved = input<boolean>(false);
  save = output<void>();
  activeTab = signal<'workout' | 'diet' | 'supplements' | 'shopping'>('workout');

  // Dynamic Loading Messages
  loadingSteps = [
    "Analisando perfil biológico...",
    "Calculando Taxa Metabólica Basal...",
    "Definindo divisão de treino...",
    "Selecionando exercícios e cargas...",
    "Balanceando macronutrientes...",
    "Criando lista de compras...",
    "Finalizando plano personalizado..."
  ];
  
  currentMessage = signal<string>(this.loadingSteps[0]);

  constructor() {
    effect((onCleanup) => {
      if (this.isLoading()) {
        let stepIndex = 0;
        this.currentMessage.set(this.loadingSteps[0]);
        
        const intervalId = setInterval(() => {
          stepIndex = (stepIndex + 1) % this.loadingSteps.length;
          this.currentMessage.set(this.loadingSteps[stepIndex]);
        }, 1800); // Change message every 1.8 seconds

        onCleanup(() => {
          clearInterval(intervalId);
        });
      }
    });
  }

  onSave() {
    this.save.emit();
  }
}