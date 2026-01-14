
export interface UserData {
  // Biological
  age: number | null;
  gender: string;
  weight: number | null;
  height: number | null;
  
  // Training
  level: string;
  experience: string; // 'sim' | 'nao'
  
  // Goals & Logistics
  goal: string;
  daysAvailable: number | null;
  timeAvailable: string;
  location: string;
  
  // Health
  injuries: string;
  conditions: string;
  
  // Nutrition & Budget
  restrictions: string;
  likes: string;
  dislikes: string;
  supplements: string;
  budget: string; // 'Econômico' | 'Moderado' | 'Alto'
}

export interface PlanResponse {
  profile: {
    diagnosis: string;
    calories: number;
    macros: { protein: number; carbs: number; fats: number };
    hydration: number;
  };
  workout: {
    day: string;
    focus: string;
    exercises: { 
      name: string; 
      sets: number; 
      reps: string; 
      rest: string; 
      tip: string; 
    }[];
    cardio: string;
  }[];
  diet: {
    mealName: string; // Café da manhã, etc.
    tips: string; // Dica de preparo/tempero
    options: { 
      name: string; 
      quantity: string; 
      measure: string; 
      substitution: string; 
    }[];
  }[];
  supplements: {
    name: string;
    reason: string;
    dosage: string;
  }[];
  shoppingList: string[];
}

export interface UserProfile {
  name: string;
  email: string;
  memberSince: string;
}

export interface SavedPlan {
  id: string;
  date: string;
  startDate: number; // Timestamp for 7-day calculation
  weekCount: number; // 1, 2, 3... tracking the cycle
  name: string; // Ex: "Hipertrofia - Março"
  data: PlanResponse;
  userData: UserData;
  personalNotes?: string; // Notas de progresso, cargas, etc.
}

export interface ChatMessage {
  role: 'user' | 'model';
  text: string;
  timestamp: Date;
}
