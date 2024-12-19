import mysql from 'mysql2';
import { MYSQL_PUBLIC_URL } from './config.js';

// Crear la conexión a la base de datos usando MYSQL_PUBLIC_URL
const connection = mysql.createConnection(MYSQL_PUBLIC_URL);

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
