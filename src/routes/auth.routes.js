import { Router } from 'express';
import { check } from 'express-validator';
import { register, login, logout, checkUsuarioConTurno} from '../controllers/auth.controllers.js';
import { verifyToken } from '../middlewares/verifyToken.js';

const router = Router();

// Validación de datos para el registro
const validateRegisterSchema = [
    check('nombre').notEmpty().withMessage('El nombre es obligatorio'),
    check('email').isEmail().withMessage('Debe ser un correo electrónico válido'),
    check('password').isLength({ min: 6 }).withMessage('La contraseña debe tener al menos 6 caracteres'),
    check('telefono').notEmpty().withMessage('El teléfono es obligatorio'),
];

// Validación de datos para el login
const validateLoginSchema = [
    check('email').isEmail().withMessage('Debe ser un correo electrónico válido'),
    check('password').notEmpty().withMessage('La contraseña es obligatoria'),
];

// Ruta para chequear si el usuario tiene sesión activa
router.get('/check-session', verifyToken(), (req, res) => {
    console.log('Usuario autenticado:', req.user);
    res.status(200).json({
        message: 'Sesión activa',
        user: req.user, // Información del usuario del token
    });
});

router.get('/usuario/turno', verifyToken(), checkUsuarioConTurno);

// Rutas de autenticación
router.post('/register', validateRegisterSchema, register);
router.post('/login', validateLoginSchema, login);
router.post('/logout', logout);

export default router;
