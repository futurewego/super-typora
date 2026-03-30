export interface UserAccount {
  id: string;
  email: string;
  createdAt: number;
  lastSeenAt: number;
}

export interface CloudSession {
  id: string;
  userId: string;
  deviceId: string;
  createdAt: number;
  expiresAt: number;
}

export interface CloudDevice {
  id: string;
  userId: string;
  name: string;
  createdAt: number;
  lastSeenAt: number;
}
