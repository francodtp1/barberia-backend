import { Router } from 'express';
import { check } from 'express-validator';
import { createTurno, getTurnos, deleteTurno, getTurnosByFecha, getTurnosDisponibles} from '../controllers/turnos.controllers.js';
import { createTurnoReservado, getTurnosReservados, deleteTurnoReservado, limpiarTurnosReservados } from '../controllers/turnosReservados.controllers.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = Router();

// Validación de datos para crear un turno
const validateCreateTurnoSchema = [
    check('fecha').isISO8601().withMessage('La fecha debe tener un formato válido (YYYY-MM-DD)'),
    check('hora').matches(/^([0-1]?\d|2[0-3]):[0-5]\d$/).withMessage('La hora debe tener un formato válido (HH:mm)'),
];

// Rutas para manejar turnos
router.post('/create', verifyToken(['admin']), validateCreateTurnoSchema, createTurno);
router.get('/', verifyToken(), getTurnos);
router.get('/disponibles', verifyToken(), getTurnosDisponibles);
router.get('/fecha', verifyToken(), getTurnosByFecha); 
router.delete('/:id', verifyToken(['admin']), deleteTurno);

// Rutas para manejar turnos reservados
router.post('/reservar', verifyToken(), createTurnoReservado);
router.get('/limpiarTurnos', verifyToken(), limpiarTurnosReservados);
router.get('/reservados', verifyToken(['admin']), getTurnosReservados);
router.delete('/reservados/:id', verifyToken(['admin']), deleteTurnoReservado);

export default router;
