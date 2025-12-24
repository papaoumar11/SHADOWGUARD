import { GoogleGenAI, Type } from "@google/genai";
import { SuspiciousApp } from '../types';

// Initialize Gemini Client
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

// Mock data for App analysis
const MOCK_INSTALLED_APPS = [
  { name: "Flashlight Pro", permissions: ["CAMERA", "LOCATION", "READ_CONTACTS"], packageName: "com.flash.light.pro" },
  { name: "Social Connect", permissions: ["INTERNET", "CAMERA", "RECORD_AUDIO"], packageName: "com.social.connect" },
  { name: "Free Wifi Map", permissions: ["LOCATION", "ACCESS_WIFI_STATE", "READ_SMS"], packageName: "com.freewifi.map" },
  { name: "Calculator Vault", permissions: ["READ_EXTERNAL_STORAGE", "SYSTEM_ALERT_WINDOW"], packageName: "com.calc.vault" },
  { name: "Daily Weather", permissions: ["LOCATION", "INTERNET"], packageName: "com.weather.daily" },
  { name: "Keyboard Themes", permissions: ["INTERNET", "READ_KEYSTROKES_SIMULATED"], packageName: "com.key.themes" }
];

// Mock data for Network analysis
const MOCK_NETWORK_TRAFFIC = [
  { protocol: "HTTPS", target: "104.23.1.5", port: 443, data_size: "1.2MB", flags: "NONE" },
  { protocol: "DNS", target: "8.8.8.8", query: "api.spy-tracker.ru", status: "RESOLVED" },
  { protocol: "HTTP", target: "local-proxy", port: 8080, data_size: "45KB", flags: "UNENCRYPTED" },
  { protocol: "TCP", target: "unknown-host-x", port: 22, data_size: "500B", flags: "SYN_SENT" },
  { protocol: "ICMP", target: "192.168.1.1", type: "ECHO_REQUEST", status: "FLOOD_DETECTED" }
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
      model: "gemini-3-flash-preview",
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
    console.error("Gemini App Analysis Failed:", error);
    return [];
  }
};

export const analyzeNetworkWithGemini = async (): Promise<any[]> => {
  try {
    const prompt = `
      Vous êtes un expert en sécurité réseau. Analysez le trafic réseau simulé suivant pour détecter des anomalies, des attaques MITM, des serveurs C&C ou des fuites de données.
      
      Trafic :
      ${JSON.stringify(MOCK_NETWORK_TRAFFIC)}

      Retournez une analyse JSON structurée d'anomalies détectées.
    `;

    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: prompt,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              id: { type: Type.STRING },
              name: { type: Type.STRING, description: "Nom de l'anomalie" },
              detail: { type: Type.STRING, description: "Description technique" },
              severity: { type: Type.STRING, enum: ["LOW", "MEDIUM", "HIGH"] },
              status: { type: Type.STRING, enum: ["SAFE", "WARNING", "DANGEROUS"] }
            },
            required: ["id", "name", "detail", "severity", "status"]
          }
        }
      }
    });

    return JSON.parse(response.text || "[]");
  } catch (error) {
    console.error("Gemini Network Analysis Failed:", error);
    return [];
  }
};

export const getSecurityAdvice = async (event: string): Promise<string> => {
  try {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Donne-moi un conseil de sécurité court (max 20 mots) en français concernant cet événement : ${event}`,
    });
    return response.text || "Restez vigilant.";
  } catch (e) {
    return "Sécurisez votre appareil immédiatement.";
  }
};