import { Component, signal, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule } from '@angular/common';
import { AnamnesisFormComponent } from './components/anamnesis-form.component';
import { PlanDisplayComponent } from './components/plan-display.component';
import { AuthComponent } from './components/auth.component';
import { DashboardComponent } from './components/dashboard.component';
import { ChatBotComponent } from './components/chat-bot.component';
import { GeminiService } from './services/gemini.service';
import { StorageService } from './services/storage.service';
import { UserData, PlanResponse, UserProfile, SavedPlan } from './models';

type AppState = 'auth' | 'dashboard' | 'input' | 'loading' | 'result' | 'error';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [
    CommonModule, 
    AnamnesisFormComponent, 
    PlanDisplayComponent, 
    AuthComponent, 
    DashboardComponent,
    ChatBotComponent 
  ],
  templateUrl: './app.component.html'
})
export class AppComponent implements OnInit, OnDestroy {
  private geminiService = inject(GeminiService);
  private storageService = inject(StorageService);

  // App State
  appState = signal<AppState>('auth');
  currentUser = signal<UserProfile | null>(null);
  currentPlan = signal<PlanResponse | null>(null);
  currentUserData = signal<UserData | null>(null); // Store form data for saving context
  savedPlans = signal<SavedPlan[]>([]);
  errorMessage = signal<string>('');
  
  // Flag to know if the currently displayed plan is already saved
  isCurrentPlanSaved = signal<boolean>(false);
  
  // Track context for evolution saving
  evolutionContext = signal<{ weekCount: number, previousId: string } | null>(null);

  // Hydration Reminder State
  showWaterReminder = signal<boolean>(false);
  private reminderInterval: any;

  ngOnInit() {
    // 1. Check for existing user session on load
    const user = this.storageService.getCurrentSession();
    if (user) {
      this.currentUser.set(user);
      this.refreshPlans();
      this.appState.set('dashboard');
    } else {
      this.appState.set('auth');
    }

    // 2. Start Hydration Timer (Checks every hour)
    this.startHydrationTimer();
  }

  ngOnDestroy() {
    if (this.reminderInterval) {
      clearInterval(this.reminderInterval);
    }
  }

  private startHydrationTimer() {
    // 3600000 ms = 1 hour
    this.reminderInterval = setInterval(() => {
      // Only show if user is logged in AND viewing a plan (so we know the goal)
      if (this.currentUser() && this.currentPlan()) {
        this.triggerWaterReminder();
      }
    }, 3600000); 
  }

  private triggerWaterReminder() {
    this.showWaterReminder.set(true);
    // Auto hide after 15 seconds if not interacted
    setTimeout(() => {
      this.showWaterReminder.set(false);
    }, 15000);
  }

  dismissReminder() {
    this.showWaterReminder.set(false);
  }

  // --- Auth & Navigation Logic ---

  handleLoginSuccess(user: UserProfile) {
    // Session is already created in AuthComponent -> StorageService
    // Just update local state
    this.currentUser.set(user);
    this.refreshPlans();
    this.appState.set('dashboard');
  }

  handleLogout() {
    this.storageService.logout();
    this.currentUser.set(null);
    this.currentPlan.set(null);
    this.savedPlans.set([]);
    this.showWaterReminder.set(false); // Clear reminder
    this.geminiService.resetChat(); // Reset chat history on logout
    this.appState.set('auth');
  }

  goToCreatePlan() {
    this.appState.set('input');
    this.currentPlan.set(null);
    this.evolutionContext.set(null); // Reset evolution
    this.isCurrentPlanSaved.set(false);
  }

  returnToDashboard() {
    this.currentPlan.set(null);
    this.refreshPlans(); // Ensure list is fresh
    this.appState.set('dashboard');
  }

  // --- Core Feature Logic ---

  async handleFormSubmit(data: UserData) {
    this.currentUserData.set(data);
    this.appState.set('loading');
    this.errorMessage.set('');
    this.evolutionContext.set(null); // New fresh plan

    try {
      const plan = await this.geminiService.generatePlan(data);
      this.currentPlan.set(plan);
      this.isCurrentPlanSaved.set(false); // New plan is not saved yet
      this.appState.set('result');
      
      setTimeout(() => this.triggerWaterReminder(), 5000); 

    } catch (error) {
      console.error('Error generating plan:', error);
      this.errorMessage.set('Ocorreu um erro ao conectar com o TotalFit AI. Por favor, tente novamente.');
      this.appState.set('error');
    }
  }

  // --- Evolution Logic ---
  async handleEvolution(event: { plan: SavedPlan, weight: number, feedback: string }) {
    this.appState.set('loading');
    this.errorMessage.set('');
    
    try {
      // Generate the evolved plan
      const newPlanData = await this.geminiService.evolvePlan(event.plan, event.weight, event.feedback);
      
      // Update UserData context with new weight
      const updatedUserData = { ...event.plan.userData, weight: event.weight };
      this.currentUserData.set(updatedUserData);
      this.currentPlan.set(newPlanData);
      
      // Set context so 'handleSavePlan' knows this is Week X+1
      this.evolutionContext.set({
        weekCount: event.plan.weekCount + 1,
        previousId: event.plan.id
      });
      
      this.isCurrentPlanSaved.set(false);
      this.appState.set('result');

    } catch (error) {
       console.error('Error evolving plan:', error);
       this.errorMessage.set('Falha ao gerar evolução. Tente novamente.');
       this.appState.set('error');
    }
  }

  // --- Storage & Plan Management Logic ---

  private refreshPlans() {
    this.savedPlans.set(this.storageService.getPlans());
  }

  handleSavePlan() {
    const plan = this.currentPlan();
    const userData = this.currentUserData();
    const user = this.currentUser();
    const evoContext = this.evolutionContext();
    
    if (plan && userData && user) {
      const weekNum = evoContext ? evoContext.weekCount : 1;
      
      const newSavedPlan: SavedPlan = {
        id: crypto.randomUUID(),
        date: new Date().toLocaleDateString('pt-BR'),
        startDate: Date.now(), // Sets the clock for the next 7 days
        weekCount: weekNum,
        name: `${userData.goal} (Semana ${weekNum})`,
        data: plan,
        userData: userData,
        personalNotes: '' 
      };
      
      this.storageService.savePlan(newSavedPlan);
      
      // If this was an evolution, maybe we want to archive/update the old one?
      // For now, we just add to the top of the stack as the "Active" one.
      
      this.isCurrentPlanSaved.set(true);
      this.refreshPlans(); 
    }
  }

  handleViewSavedPlan(savedPlan: SavedPlan) {
    this.currentPlan.set(savedPlan.data);
    this.currentUserData.set(savedPlan.userData);
    this.isCurrentPlanSaved.set(true); 
    this.appState.set('result');
  }

  handleDeletePlan(id: string) {
    if(confirm('Tem certeza que deseja excluir este plano?')) {
      this.storageService.deletePlan(id);
      this.refreshPlans();
    }
  }

  handleUpdatePlan(updatedPlan: SavedPlan) {
    this.storageService.updatePlan(updatedPlan);
    this.refreshPlans();
  }
}