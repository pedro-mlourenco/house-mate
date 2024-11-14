// src/config/environment.ts
export const isDevelopment = (): boolean => {
    return process.env.NODE_ENV === 'development';
};

export const isProduction = (): boolean => {
    return process.env.NODE_ENV === 'production';
};