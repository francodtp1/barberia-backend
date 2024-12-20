import bcrypt from 'bcrypt';
import connection from '../db.js';
import pool from '../db.js';
import { validationResult } from 'express-validator';
import jwt from 'jsonwebtoken';
import { JWT_SECRET } from '../config.js';
import { limpiarTurnosReservados } from './turnosReservados.controllers.js';

// Expresión regular para validar números de teléfono de Argentina (con y sin el prefijo)
const telefonoRegex = /^(?:\+54\s9?\s?\(?\d{1,4}\)?\s?\d{4,5}\s?\d{4,5}|\d{10})$/;


// Controlador para registrar un usuario
export const register = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { nombre, email, password, telefono } = req.body;

    try {
        // Verificar si el número de teléfono ya está registrado
        const [existingPhone] = await pool.query('SELECT * FROM usuarios WHERE telefono = ?', [telefono]);
        if (existingPhone.length > 0) {
            return res.status(400).json({ message: 'El número de teléfono ya está registrado' });
        }

        // Validar el formato del teléfono
        if (!telefonoRegex.test(telefono)) {
            return res.status(400).json({ message: 'El número de teléfono no es válido. Debe ser un número válido de Argentina.' });
        }

        // Verificar si el usuario ya existe por correo electrónico
        const [userByEmail] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);
        if (userByEmail.length > 0) {
            return res.status(400).json({ message: 'El correo electrónico ya está registrado' });
        }

        // Verificar si el usuario ya existe por nombre
        const [userByName] = await pool.query('SELECT * FROM usuarios WHERE nombre = ?', [nombre]);
        if (userByName.length > 0) {
            return res.status(400).json({ message: 'El nombre de usuario ya está registrado' });
        }

        // Encriptar la contraseña
        const hashedPassword = await bcrypt.hash(password, 10);

        // Insertar el usuario en la base de datos
        await pool.query(
            'INSERT INTO usuarios (nombre, email, password, telefono) VALUES (?, ?, ?, ?)',
            [nombre, email, hashedPassword, telefono]
        );

        res.status(201).json({ message: 'Usuario registrado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al registrar el usuario' });
    }
};


// Controlador para login
export const login = async (req, res) => {
    const errors = validationResult(req);

    if (!errors.isEmpty()) {
        return res.status(400).json({ errors: errors.array() });
    }

    const { email, password } = req.body;

    try {
        // Verificar si el usuario existe en la base de datos
        const [rows] = await pool.query('SELECT * FROM usuarios WHERE email = ?', [email]);

        if (rows.length === 0) {
            return res.status(404).json({ message: 'El correo electrónico no está registrado' });
        }

        const user = rows[0];

        // Verificar la contraseña_
        const isMatch = await bcrypt.compare(password, user.password);
        if (!isMatch) {
            return res.status(400).json({ message: 'La contraseña es incorrecta' });
        }

        // Generar un token de acceso
        const token = jwt.sign(
            { id: user.id, email: user.email, role: user.rol }, 
            JWT_SECRET,
            { expiresIn: '2h' }
        );

        // Configurar la cookie con el token
        res.cookie('token-jwt', token, {
            httpOnly: true,
            secure: 'production', // Solo para HTTPS
            sameSite: 'lax', // Subdominios cruzados
        });

        // Responder con los datos del usuario
        res.status(200).json({
            id: user.id,
            nombre: user.nombre,
            email: user.email,
            role: user.role, // Si tienes un campo de rol
        });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error interno del servidor' });
    }
};

export const logout = (req, res) => {
    res.clearCookie('token-jwt', {
        httpOnly: true,
        secure: false,
        sameSite: 'lax',
    });
    res.status(200).json({ message: 'Sesión cerrada correctamente' });
};

// Controlador para verificar si un usuario tiene un turno pendiente
export const checkUsuarioConTurno = async (req, res) => {
    await limpiarTurnosReservados()
    const { id } = req.user; // Suponiendo que el usuario autenticado está en req.user

    try {
        // Consulta para obtener el turno reservado del usuario
        const [result] = await pool.query(
            `SELECT td.fecha, TIME_FORMAT(td.hora, '%H:%i') AS hora
             FROM turnos_reservados tr
             INNER JOIN turnos_disponibles td ON tr.turno_id = td.id
             WHERE tr.cliente_id = ?`,
            [id]
        );

        if (result.length === 0) {
            return res.status(200).json({ message: 'No tienes turnos pendientes.' });
        }

        const { fecha, hora } = result[0];

        return res.status(200).json({
            message: 'Ya tienes un turno pendiente.',
            turno: {
                fecha,
                hora,
            },
        });
    } catch (error) {
        console.error('Error al verificar el turno del usuario:', error);
        res.status(500).json({ message: 'Error al verificar el turno del usuario.' });
    }
};

export const getUsuarios = async (req, res) => {
    try {
        const [usuarios] = await pool.query(
            `SELECT id, nombre, email, telefono, rol, con_turno, created_at 
             FROM usuarios 
             ORDER BY created_at DESC`
        );
        res.status(200).json(usuarios);
    } catch (error) {
        console.error('Error al obtener los usuarios:', error);
        res.status(500).json({ message: 'Error al obtener los usuarios' });
    }
};

