export enum AppView {
  DASHBOARD = 'DASHBOARD',
  ANTI_THEFT = 'ANTI_THEFT',
  ANTI_SPY = 'ANTI_SPY',
  REMOTE = 'REMOTE',
  REPORTS = 'REPORTS'
}

export interface SecurityEvent {
  id: string;
  type: 'INTRUSION' | 'SPYWARE' | 'SYSTEM' | 'NETWORK' | 'MESSAGE' | 'BAIT_ATTEMPT';
  severity: 'LOW' | 'MEDIUM' | 'HIGH' | 'CRITICAL';
  message: string;
  timestamp: Date;
}

export interface SuspiciousApp {
  name: string;
  packageName: string;
  riskScore: number; // 0-100
  permissions: string[];
  reason: string;
  status: 'SAFE' | 'WARNING' | 'DANGEROUS';
}

export interface DeviceStatus {
  batteryLevel: number;
  isCharging: boolean;
  isProtected: boolean;
  lastScan: Date | null;
  location: { lat: number; lng: number } | null;
  ownerPhoneNumber: string;
}