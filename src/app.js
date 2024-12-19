import express from 'express';
import cors from "cors";
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js'
import turnosRoutes from './routes/turnos.routes.js'
import { verifyToken } from './middlewares/verifyToken.js';
import { getUsuarios } from './controllers/auth.controllers.js';
import { FRONTEND_URL, FRONTEND_URL_WWW } from './config.js';

const app = express();

const allowedOrigins = [
    FRONTEND_URL,
    FRONTEND_URL_WWW
];

// Configuración de CORS
const corsOptions = {
    origin: function (origin, callback) {
        // Permitir solicitudes sin origen (como desde herramientas de prueba)
        if (!origin) return callback(null, true);
        if (allowedOrigins.includes(origin)) {
            callback(null, true);
        } else {
            callback(new Error('No permitido por CORS'));
        }
    },
    methods: ["POST", "PUT", "DELETE", "GET", "OPTIONS"],
    credentials: true, // Permitir el envío de cookies
};


app.use(express.json());
app.use(cookieParser());
app.use(bodyParser.json());
app.use(cors(corsOptions));

// Rutas principales
app.use('/api/auth', authRoutes);
app.use('/api/turnos', turnosRoutes);
app.use('/api/usuarios', verifyToken(['admin']), getUsuarios);

// Middleware para manejar errores
app.use((err, req, res, next) => {
    console.error(err.stack);
    res.status(500).send({ error: '¡Algo salió mal!' });
});

export default app;
