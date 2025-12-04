import { GoogleGenAI, Type } from "@google/genai";
import { SuspiciousApp } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Mock data to send to Gemini if we can't access real installed apps in a web browser
const MOCK_INSTALLED_APPS = [
  { name: "Flashlight Pro", permissions: ["CAMERA", "LOCATION", "READ_CONTACTS"], packageName: "com.flash.light.pro" },
  { name: "Social Connect", permissions: ["INTERNET", "CAMERA", "RECORD_AUDIO"], packageName: "com.social.connect" },
  { name: "Free Wifi Map", permissions: ["LOCATION", "ACCESS_WIFI_STATE", "READ_SMS"], packageName: "com.freewifi.map" },
  { name: "Calculator Vault", permissions: ["READ_EXTERNAL_STORAGE", "SYSTEM_ALERT_WINDOW"], packageName: "com.calc.vault" },
  { name: "Daily Weather", permissions: ["LOCATION", "INTERNET"], packageName: "com.weather.daily" },
  { name: "Keyboard Themes", permissions: ["INTERNET", "READ_KEYSTROKES_SIMULATED"], packageName: "com.key.themes" }
];

export const analyzeAppsWithGemini = async (): Promise<SuspiciousApp[]> => {
  try {
    const prompt = `
      Vous êtes un expert en cybersécurité mobile. Analysez la liste suivante d'applications installées (simulées) et de leurs permissions.
      Détectez les comportements suspects (logiciels espions, logiciels malveillants, permissions excessives).
      
      Liste des applications :
      ${JSON.stringify(MOCK_INSTALLED_APPS)}

      Retournez une analyse JSON structurée.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              name: { type: Type.STRING },
              packageName: { type: Type.STRING },
              riskScore: { type: Type.NUMBER, description: "Score from 0 (Safe) to 100 (Critical)" },
              permissions: { 
                type: Type.ARRAY, 
                items: { type: Type.STRING } 
              },
              reason: { type: Type.STRING, description: "Why is this app dangerous?" },
              status: { type: Type.STRING, enum: ["SAFE", "WARNING", "DANGEROUS"] }
            },
            required: ["name", "packageName", "riskScore", "permissions", "reason", "status"]
          }
        }
      }
    });

    const jsonText = response.text;
    if (!jsonText) return [];

    return JSON.parse(jsonText) as SuspiciousApp[];

  } catch (error) {
    console.error("Gemini Analysis Failed:", error);
    // Fallback in case of error (returns a manual dummy threat)
    return [{
      name: "Analysis Error",
      packageName: "unknown",
      riskScore: 0,
      permissions: [],
      reason: "Could not connect to AI service.",
      status: "SAFE"
    }];
  }
};

export const getSecurityAdvice = async (event: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-2.5-flash",
      contents: `Donne-moi un conseil de sécurité court (max 20 mots) en français concernant cet événement : ${event}`,
    });
    return response.text || "Restez vigilant.";
  } catch (e) {
    return "Sécurisez votre appareil immédiatement.";
  }
};
