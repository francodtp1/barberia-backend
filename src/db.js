import mysql from 'mysql2/promise';
import { MYSQL_PUBLIC_URL } from './config.js';

// Crear un pool de conexiones
const pool = mysql.createPool({
    uri: MYSQL_PUBLIC_URL,
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
});

// Exportar el pool
export default pool;
