import { config } from "dotenv";
config();

const requiredEnv = [
  'DB_HOST',
  'DB_USER',
  'DB_NAME',
  'JWT_SECRET',
  'PORT' 
];   

requiredEnv.forEach((envVar) => { 
  if (!process.env[envVar]) {
    console.error(`Falta la variable de entorno: ${envVar}`);
    process.exit(1); 
  }
}); 
 
export const DB_HOST = process.env.DB_HOST; 
export const DB_USER = process.env.DB_USER;
export const DB_PASSWORD = process.env.DB_PASSWORD || '';
export const DB_NAME = process.env.DB_NAME;
export const PORT = process.env.PORT || 3306; 
export const JWT_SECRET = process.env.JWT_SECRET;

 