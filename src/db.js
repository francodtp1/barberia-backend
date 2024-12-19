import mysql from 'mysql2';
import { DB_HOST, DB_USER, DB_PASSWORD, DB_NAME } from './config.js';

// Crear la conexión a la base de datos
const connection = mysql.createConnection({
    host: DB_HOST,
    user: DB_USER,
    password: DB_PASSWORD,
    database: DB_NAME,
});

// Conectar y manejar errores
connection.connect((err) => {
    if (err) {
        console.error('Error al conectar a la base de datos:', err.message);
        process.exit(1); // Detener el servidor si la conexión falla
    }
    console.log('Conectado a la base de datos MySQL');
});

// Exportar la conexión
export default connection;
