import express from 'express';
import cors from "cors";
import bodyParser from 'body-parser';
import cookieParser from 'cookie-parser';
import authRoutes from './routes/auth.routes.js'
import turnosRoutes from './routes/turnos.routes.js'
import { verifyToken } from './middlewares/verifyToken.js';
import { getUsuarios } from './controllers/auth.controllers.js';
const app = express();

app.use(express.json());
app.use(cookieParser());

// Middlewares globales
app.use(cors({
    origin: 'http://localhost:5173', // Dominio del frontend
    credentials: true, // Permitir credenciales
}));

app.use(bodyParser.json());

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
