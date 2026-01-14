import { Injectable } from '@angular/core';
import { GoogleGenAI, Type, Chat } from "@google/genai";
import { UserData, PlanResponse, SavedPlan } from '../models';

@Injectable({
  providedIn: 'root'
})
export class GeminiService {
  private ai: GoogleGenAI;
  private chatSession: Chat | null = null;
  private lastPlanContextHash: string = '';

  constructor() {
    this.ai = new GoogleGenAI({ apiKey: process.env['API_KEY'] || '' });
  }

  // --- Base Plan Generation ---
  async generatePlan(userData: UserData): Promise<PlanResponse> {
    const prompt = `
      ATUE COMO O "TotalFit AI".
      
      DADOS:
      Bio: ${userData.age}a, ${userData.gender}, ${userData.weight}kg, ${userData.height}cm
      Nível: ${userData.level}, Meta: ${userData.goal}
      Treino: ${userData.daysAvailable}d/sem, ${userData.timeAvailable}, Local: ${userData.location}
      Restrições: ${userData.injuries || 'Nenhuma'}, ${userData.restrictions || 'Nenhuma'}
      
      TAREFA: Gerar JSON de plano semanal.
      
      REGRAS CRÍTICAS DE TAMANHO (ANTI-TRUNCAMENTO):
      1. TREINO: Gere no MÁXIMO 3 a 4 treinos distintos. Se o usuário treina 5x, repita os treinos (Ex: Day: "Segunda e Quinta").
         - Max 5 exercícios por treino.
         - Strings curtas. Sem explicações longas.
      2. DIETA: Menu ÚNICO diário (Ex: Café, Almoço, Jantar).
         - 1 ou 2 opções max por refeição.
      3. GERAL:
         - Sem introduções.
         - "tips" devem ter max 5 palavras.
    `;

    return this.callGemini(prompt);
  }

  // --- Evolution Plan Generation ---
  async evolvePlan(previousPlan: SavedPlan, currentWeight: number, userFeedback: string): Promise<PlanResponse> {
    const weekNum = previousPlan.weekCount + 1;
    const weightDiff = currentWeight - (previousPlan.userData.weight || currentWeight);
    const weightTrend = weightDiff < 0 ? `perdeu ${Math.abs(weightDiff).toFixed(1)}kg` : `ganhou ${weightDiff.toFixed(1)}kg`;

    const prompt = `
      EVOLUÇÃO SEMANA ${weekNum}.
      Peso: ${previousPlan.userData.weight}->${currentWeight}kg. Meta: ${previousPlan.userData.goal}.
      Feedback: "${userFeedback}".
      
      TAREFA: Gerar JSON atualizado.
      REGRAS:
      1. Simplifique ao máximo.
      2. Agrupe dias de treino (Ex: "Seg/Qui").
      3. Max 5 exercícios/treino.
    `;

    return this.callGemini(prompt);
  }

  // --- Helper to execute the call ---
  private async callGemini(prompt: string): Promise<PlanResponse> {
    const response = await this.ai.models.generateContent({
      model: 'gemini-2.5-flash',
      contents: prompt,
      config: {
        maxOutputTokens: 8192,
        responseMimeType: 'application/json',
        responseSchema: {
          type: Type.OBJECT,
          properties: {
            profile: {
              type: Type.OBJECT,
              properties: {
                diagnosis: { type: Type.STRING },
                calories: { type: Type.NUMBER },
                macros: {
                  type: Type.OBJECT,
                  properties: {
                    protein: { type: Type.NUMBER },
                    carbs: { type: Type.NUMBER },
                    fats: { type: Type.NUMBER }
                  }
                },
                hydration: { type: Type.NUMBER }
              }
            },
            workout: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  day: { type: Type.STRING, description: "Ex: 'Segunda e Quinta' ou 'Treino A'" },
                  focus: { type: Type.STRING },
                  cardio: { type: Type.STRING },
                  exercises: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        sets: { type: Type.NUMBER },
                        reps: { type: Type.STRING },
                        rest: { type: Type.STRING },
                        tip: { type: Type.STRING }
                      }
                    }
                  }
                }
              }
            },
            diet: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  mealName: { type: Type.STRING },
                  tips: { type: Type.STRING },
                  options: {
                    type: Type.ARRAY,
                    items: {
                      type: Type.OBJECT,
                      properties: {
                        name: { type: Type.STRING },
                        quantity: { type: Type.STRING },
                        measure: { type: Type.STRING },
                        substitution: { type: Type.STRING }
                      }
                    }
                  }
                }
              }
            },
            supplements: {
              type: Type.ARRAY,
              items: {
                type: Type.OBJECT,
                properties: {
                  name: { type: Type.STRING },
                  reason: { type: Type.STRING },
                  dosage: { type: Type.STRING }
                }
              }
            },
            shoppingList: {
              type: Type.ARRAY,
              items: { type: Type.STRING }
            }
          }
        }
      }
    });

    if (!response.text) {
      throw new Error('No response from AI');
    }

    let jsonString = response.text;
    
    // Clean potential markdown blocks
    jsonString = jsonString.trim();
    if (jsonString.startsWith('```json')) {
        jsonString = jsonString.replace(/^```json\s*/, '').replace(/\s*```$/, '');
    } else if (jsonString.startsWith('```')) {
        jsonString = jsonString.replace(/^```\s*/, '').replace(/\s*```$/, '');
    }

    // JSON Repair Attempt (Simple)
    // If it ends abruptly, try to close it.
    // This is a naive heuristic but saves many cases where just the last brace is missing.
    // However, if it cuts off in the middle of a string, it's harder.
    
    try {
        return JSON.parse(jsonString) as PlanResponse;
    } catch (e) {
        console.error("JSON Parse Error:", e);
        console.error("Partial JSON:", jsonString.slice(-200)); 
        
        throw new Error('O plano gerado foi muito extenso. Tente simplificar seus dados ou tentar novamente.');
    }
  }

  // --- Chat Bot Logic ---
  async sendMessageToCoach(message: string, planContext: PlanResponse | null = null): Promise<string> {
    const currentContextString = planContext 
      ? JSON.stringify(planContext.profile || {}) + JSON.stringify(planContext.workout || []) 
      : 'no-plan';
    
    if (!this.chatSession || this.lastPlanContextHash !== currentContextString) {
      this.lastPlanContextHash = currentContextString;
      
      let systemInstruction = `
        Você é o 'Coach TotalFit'.
        REGRAS:
        1. Respostas CURTAS e diretas.
        2. Se perguntar de exercício, dê link do Youtube: "🎥 [Ver vídeo](https://www.youtube.com/results?search_query=como+fazer+NOME)".
      `;

      if (planContext) {
        const workouts = Array.isArray(planContext.workout) ? planContext.workout : [];
        const diet = Array.isArray(planContext.diet) ? planContext.diet : [];
        const supplements = Array.isArray(planContext.supplements) ? planContext.supplements : [];

        // Simplify context to save tokens in chat history
        const workoutSummary = workouts.map(d => ({
          d: d?.day, 
          f: d?.focus, 
          e: Array.isArray(d?.exercises) ? d.exercises.map(e => e?.name) : []
        }));

        const dietSummary = diet.map(m => m?.mealName);

        systemInstruction += `
          CONTEXTO:
          - Meta: ${planContext.profile?.diagnosis}
          - Treino: ${JSON.stringify(workoutSummary)}
          - Dieta: ${JSON.stringify(dietSummary)}
          - Supl: ${JSON.stringify(supplements)}
        `;
      }

      this.chatSession = this.ai.chats.create({
        model: 'gemini-2.5-flash',
        config: { systemInstruction }
      });
    }

    const response = await this.chatSession.sendMessage({ message });
    return response.text || 'Erro de comunicação.';
  }
  
  resetChat() {
    this.chatSession = null;
    this.lastPlanContextHash = '';
  }
}