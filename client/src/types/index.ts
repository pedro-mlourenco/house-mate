// src/types/index.ts
export interface User {
    email: string;
    name: string;
    role: 'user' | 'admin';
  }
  
  export interface Item {
    _id: string;
    name: string;
    category: string;
    quantity: number;
    unit: string;
  }
  
  export interface Store {
    _id: string;
    name: string;
    location: string;
    contact?: string;
  }