import { config } from "dotenv";
config();

const requiredEnv = [
  'DB_HOST',
  'DB_USER',
  'DB_NAME',
  'JWT_SECRET',
  'FRONTEND_URL', 
  'FRONTEND_URL_WWW',
  'FRONTEND_URL', 
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

export const FRONTEND_URL = process.env.FRONTEND_URL;
export const FRONTEND_URL_WWW = process.env.FRONTEND_URL_WWW;

export const MYSQL_PUBLIC_URL = process.env.MYSQL_PUBLIC_URL;

 