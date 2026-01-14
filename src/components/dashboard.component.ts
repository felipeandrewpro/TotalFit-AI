import { Component, input, output, signal } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { SavedPlan, UserProfile } from '../models';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="animate-fade-in space-y-8 pb-20">
      <!-- Welcome Header -->
      <div class="flex flex-col md:flex-row justify-between items-center bg-surface p-6 rounded-2xl border border-gray-700 shadow-lg">
        <div>
          <h2 class="text-2xl font-bold text-white">Olá, {{ user().name }}! 👋</h2>
          <p class="text-gray-400">Membro desde {{ user().memberSince }}</p>
        </div>
        <button (click)="create.emit()" class="mt-4 md:mt-0 bg-gradient-to-r from-primary to-blue-500 text-darker font-bold px-6 py-3 rounded-xl shadow-lg shadow-primary/20 hover:shadow-primary/40 transition transform hover:-translate-y-1">
          + Criar Novo Plano
        </button>
      </div>

      <!-- EVOLUTION ALERT (If applicable) -->
      @if (planToEvolve()) {
        <div class="bg-gradient-to-r from-yellow-600/20 to-orange-600/20 border border-yellow-500/50 rounded-2xl p-6 animate-pulse shadow-lg shadow-yellow-900/20">
          <div class="flex flex-col md:flex-row items-center justify-between gap-4">
            <div class="flex items-center gap-4">
              <div class="bg-yellow-500 p-3 rounded-full text-darker font-bold text-xl">🏆</div>
              <div>
                <h3 class="text-xl font-bold text-yellow-500">Ciclo de 7 Dias Concluído!</h3>
                <p class="text-gray-300 text-sm">Seu plano "{{ planToEvolve()?.name }}" completou uma semana. Hora de evoluir.</p>
              </div>
            </div>
            <button (click)="openEvolutionModal(planToEvolve()!)" class="bg-yellow-500 hover:bg-yellow-400 text-darker font-bold px-6 py-2 rounded-lg transition transform hover:scale-105">
              Atualizar Medidas & Gerar Semana {{ planToEvolve()!.weekCount + 1 }}
            </button>
          </div>
        </div>
      }

      <!-- Plans Grid -->
      <div>
        <h3 class="text-xl font-bold text-white mb-4 flex items-center gap-2">
          🗂️ Seus Planos Salvos
        </h3>
        
        @if (plans().length === 0) {
          <div class="text-center py-12 bg-dark/50 rounded-2xl border border-gray-800 border-dashed">
            <span class="text-4xl block mb-4">📝</span>
            <p class="text-gray-400 mb-4">Você ainda não tem nenhum plano salvo.</p>
            <button (click)="create.emit()" class="text-primary hover:underline">Começar agora</button>
          </div>
        } @else {
          <div class="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            @for (plan of plans(); track plan.id) {
              <div class="bg-surface rounded-xl border border-gray-700 overflow-hidden hover:border-primary/50 transition group flex flex-col h-full relative">
                
                <!-- Week Badge -->
                <div class="absolute top-2 right-2 bg-dark/80 backdrop-blur text-xs font-mono text-primary border border-primary/30 px-2 py-1 rounded">
                   Semana {{ plan.weekCount }}
                </div>

                <!-- Card Header -->
                <div class="p-5 flex-grow">
                  <div class="flex justify-between items-start mb-2">
                    <span class="text-xs bg-gray-800 text-gray-300 px-2 py-1 rounded">{{ plan.date }}</span>
                    <button (click)="delete.emit(plan.id)" class="text-gray-600 hover:text-red-400 transition" title="Excluir">
                      <svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14c0 1-1 2-2 2H7c-1 0-2-1-2-2V6"/><path d="M8 6V4c0-1 1-2 2-2h4c1 0 2 1 2 2v2"/></svg>
                    </button>
                  </div>
                  <h4 class="text-lg font-bold text-white mb-1 group-hover:text-primary transition">{{ plan.name }}</h4>
                  <p class="text-sm text-gray-400 line-clamp-2 mb-4">{{ plan.data.profile.diagnosis }}</p>
                  
                  <!-- Progress Bar for the week -->
                  <div class="mb-4">
                    <div class="flex justify-between text-[10px] text-gray-500 mb-1">
                       <span>Progresso da Semana</span>
                       <span>{{ getDaysPassed(plan.startDate) }}/7 dias</span>
                    </div>
                    <div class="w-full bg-gray-800 rounded-full h-1.5 overflow-hidden">
                       <div class="bg-primary h-full rounded-full" [style.width.%]="getProgressPercent(plan.startDate)"></div>
                    </div>
                  </div>

                  <div class="flex gap-2 text-xs text-gray-500 mb-4">
                    <span class="bg-dark px-2 py-1 rounded border border-gray-800">{{ plan.userData.goal }}</span>
                    <span class="bg-dark px-2 py-1 rounded border border-gray-800">{{ plan.userData.weight }}kg</span>
                  </div>

                  <!-- Quick Notes / Diary Section -->
                  <div class="border-t border-gray-700 pt-3">
                    <button 
                      (click)="toggleNotes(plan.id)" 
                      class="w-full flex justify-between items-center text-xs text-gray-400 hover:text-white mb-2 transition p-2 hover:bg-white/5 rounded">
                      <span class="flex items-center gap-1 font-medium text-primary">
                        @if (activeNoteId() === plan.id) {
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="18 15 12 9 6 15"/></svg>
                        } @else {
                           <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="6 9 12 15 18 9"/></svg>
                        }
                        Diário & Progresso
                      </span>
                      @if (plan.personalNotes) {
                         <span class="text-[10px] bg-gray-800 px-1.5 py-0.5 rounded">Possui notas</span>
                      }
                    </button>
                    
                    @if (activeNoteId() === plan.id) {
                      <div class="animate-fade-in bg-dark p-3 rounded-lg border border-gray-800">
                        <div class="flex justify-between items-center mb-2">
                           <label class="text-[10px] uppercase tracking-wider text-gray-500 font-bold">Registro de Treino</label>
                           <button (click)="addNoteTimestamp(plan)" class="text-[10px] text-blue-400 hover:text-blue-300 flex items-center gap-1">
                             <span>+ Data/Hora</span>
                           </button>
                        </div>
                        <textarea 
                          [ngModel]="plan.personalNotes" 
                          (ngModelChange)="plan.personalNotes = $event"
                          placeholder="Registre aqui suas cargas, como se sentiu no treino ou observações..."
                          class="w-full h-32 bg-gray-900/50 text-sm text-gray-300 p-3 rounded border border-gray-700 focus:border-primary outline-none resize-none mb-3 font-mono leading-relaxed"
                        ></textarea>
                        <button 
                          (click)="update.emit(plan)" 
                          class="w-full py-2 bg-gray-700 hover:bg-primary hover:text-darker text-xs text-white font-bold rounded transition flex items-center justify-center gap-2">
                          <svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M19 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h11l5 5v11a2 2 0 0 1-2 2z"/><polyline points="17 21 17 13 7 13 7 21"/><polyline points="7 3 7 8 15 8"/></svg>
                          Salvar Progresso
                        </button>
                      </div>
                    } @else if (plan.personalNotes) {
                       <div class="px-2 pb-2" (click)="toggleNotes(plan.id)">
                         <p class="text-xs text-gray-500 italic truncate cursor-pointer hover:text-gray-300">
                           "{{ plan.personalNotes }}"
                         </p>
                       </div>
                    }
                  </div>
                </div>

                <!-- Card Actions -->
                <button (click)="view.emit(plan)" class="w-full py-3 bg-gray-800 hover:bg-gray-700 text-gray-300 text-sm font-medium border-t border-gray-700 transition">
                  Ver Plano Completo
                </button>
              </div>
            }
          </div>
        }
      </div>
      
      <!-- Evolution Modal -->
      @if (showEvolutionModal()) {
        <div class="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-fade-in">
          <div class="bg-surface w-full max-w-md rounded-2xl border border-yellow-500/50 shadow-2xl overflow-hidden">
            <div class="bg-yellow-500/10 p-6 border-b border-yellow-500/20">
              <h3 class="text-2xl font-bold text-yellow-500 mb-1">Check-in de Evolução</h3>
              <p class="text-gray-400 text-sm">Vamos adaptar o plano para sua nova fase.</p>
            </div>
            
            <div class="p-6 space-y-4">
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Seu peso atual (kg)</label>
                <input type="number" [(ngModel)]="newWeight" class="w-full bg-dark border border-gray-700 rounded-lg p-3 text-white focus:border-primary outline-none" placeholder="Ex: 74.5">
              </div>
              
              <div>
                <label class="block text-sm font-medium text-gray-300 mb-1">Como foi a semana?</label>
                <textarea [(ngModel)]="feedback" class="w-full bg-dark border border-gray-700 rounded-lg p-3 text-white focus:border-primary outline-none h-24 resize-none" placeholder="Ex: Treino de perna foi fácil, mas senti fome à noite..."></textarea>
              </div>
            </div>

            <div class="p-6 pt-0 flex gap-3">
              <button (click)="showEvolutionModal.set(false)" class="flex-1 py-3 text-gray-400 hover:text-white transition">Cancelar</button>
              <button 
                (click)="confirmEvolution()" 
                [disabled]="!newWeight"
                class="flex-1 py-3 bg-yellow-500 hover:bg-yellow-400 text-darker font-bold rounded-xl transition disabled:opacity-50 disabled:cursor-not-allowed">
                Gerar Nova Fase
              </button>
            </div>
          </div>
        </div>
      }
    </div>
  `
})
export class DashboardComponent {
  user = input.required<UserProfile>();
  plans = input.required<SavedPlan[]>();
  
  create = output();
  view = output<SavedPlan>();
  delete = output<string>();
  update = output<SavedPlan>();
  evolve = output<{plan: SavedPlan, weight: number, feedback: string}>();

  activeNoteId = signal<string | null>(null);
  
  // Evolution Logic
  planToEvolve = signal<SavedPlan | null>(null);
  showEvolutionModal = signal(false);
  newWeight = signal<number | null>(null);
  feedback = signal<string>('');

  constructor() {
    // Check for plans ready to evolve automatically when plans load
    setTimeout(() => this.checkEvolutionEligibility(), 500);
  }

  checkEvolutionEligibility() {
    const plans = this.plans();
    const now = Date.now();
    const sevenDaysMs = 7 * 24 * 60 * 60 * 1000;
    
    // Find the most recent plan that is older than 7 days and hasn't been archived?
    // For simplicity, we check the most recent one.
    const activePlan = plans[0]; // Assuming sorted by newest
    
    if (activePlan && (now - activePlan.startDate) >= sevenDaysMs) {
      this.planToEvolve.set(activePlan);
    } else {
      this.planToEvolve.set(null);
    }
  }

  getDaysPassed(startDate: number): number {
    const diff = Date.now() - startDate;
    const days = Math.floor(diff / (1000 * 60 * 60 * 24));
    return Math.min(days, 7);
  }

  getProgressPercent(startDate: number): number {
    const days = this.getDaysPassed(startDate);
    return (days / 7) * 100;
  }

  toggleNotes(id: string) {
    this.activeNoteId.update(current => current === id ? null : id);
  }

  addNoteTimestamp(plan: SavedPlan) {
    const now = new Date();
    const stamp = `\n[${now.toLocaleDateString('pt-BR')}]: `;
    plan.personalNotes = (plan.personalNotes || '') + (plan.personalNotes ? '\n' : '') + stamp;
  }

  openEvolutionModal(plan: SavedPlan) {
    this.newWeight.set(plan.userData.weight); // Pre-fill with old weight
    this.feedback.set('');
    this.showEvolutionModal.set(true);
  }

  confirmEvolution() {
    if (this.newWeight() && this.planToEvolve()) {
      this.evolve.emit({
        plan: this.planToEvolve()!,
        weight: this.newWeight()!,
        feedback: this.feedback()
      });
      this.showEvolutionModal.set(false);
    }
  }
}