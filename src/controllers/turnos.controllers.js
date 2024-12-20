import pool from '../db.js';
import { limpiarTurnosReservados } from './turnosReservados.controllers.js';
// Utilidades comunes
const obtenerFechaHoraActual = () => {
    const now = new Date();
    const offsetMs = now.getTimezoneOffset() * 60 * 1000;
    const localNow = new Date(now.getTime() - offsetMs);
    return localNow.toISOString().slice(0, 19).replace('T', ' ');
};

export const limpiarTurnosDisponibles = async () => {
    const now = obtenerFechaHoraActual();
    try {
        const [result] = await pool.query(
            `DELETE FROM turnos_disponibles WHERE CONCAT(fecha, ' ', hora) < ?`,
            [now]
        );
        if (result.affectedRows > 0) {
            console.log(`Eliminados ${result.affectedRows} turnos disponibles vencidos hasta ${now}`);
        }
    } catch (error) {
        console.error('Error al limpiar turnos vencidos:', error);
    }
};

// Controlador para crear un turno disponible
export const createTurno = async (req, res) => {
    const { fecha, hora } = req.body;

    try {
        // Obtener la fecha y hora actuales
        const now = new Date();
        const selectedDateTime = new Date(`${fecha}T${hora}`);

        // Validar que la fecha y hora no hayan pasado
        if (selectedDateTime < now) {
            return res.status(400).json({
                message: 'No puedes crear un turno en una fecha u hora que ya pasó.',
            });
        }

        // Insertar un nuevo turno disponible
        await pool.query(
            'INSERT INTO turnos_disponibles (fecha, hora) VALUES (?, ?)',
            [fecha, hora]
        );

        res.status(201).json({ message: 'Turno creado exitosamente' });
    } catch (error) {
        if (error.code === 'ER_DUP_ENTRY') {
            res.status(400).json({ message: 'El turno ya existe para la fecha y hora especificada' });
        } else {
            console.error(error);
            res.status(500).json({ message: 'Error al crear el turno' });
        }
    }
};

// Controlador para obtener todos los turnos disponibles
export const getTurnos = async (req, res) => {
    try {
        await limpiarTurnosDisponibles();
        const [turnos] = await pool.query('SELECT * FROM turnos_disponibles');

        res.status(200).json(turnos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los turnos' });
    }
};

export const getTurnosDisponibles = async (req, res) => {
    try {
        // Limpiar turnos si es necesario
        await limpiarTurnosReservados();
        await limpiarTurnosDisponibles();

        // Consulta para obtener los turnos disponibles con formato de hora
        const [turnosDisponibles] = await pool.query(`
            SELECT 
                id, 
                fecha, 
                TIME_FORMAT(hora, "%H:%i") AS hora 
            FROM 
                turnos_disponibles 
            WHERE 
                disponible = TRUE
            ORDER BY 
                fecha ASC, hora ASC
        `);

        res.status(200).json(turnosDisponibles);
    } catch (error) {
        console.error('Error al obtener los turnos disponibles:', error);
        res.status(500).json({ message: 'Error al obtener los turnos disponibles' });
    }
};

// Controlador para obtener los turnos disponibles por fecha
export const getTurnosByFecha = async (req, res) => {
    const { fecha } = req.query;

    try {
        await limpiarTurnosDisponibles();
        const [turnos] = await pool.query(
            'SELECT id, fecha, TIME_FORMAT(hora, "%H:%i") AS hora FROM turnos_disponibles WHERE fecha = ? ORDER BY hora ASC',
            [fecha]
        );

        res.status(200).json(turnos);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los turnos' });
    }
};

// Controlador para eliminar un turno disponible
export const deleteTurno = async (req, res) => {
    const { id } = req.params;

    try {
        const [result] = await pool.query(
            'DELETE FROM turnos_disponibles WHERE id = ?',
            [id]
        );

        if (result.affectedRows === 0) {
            return res.status(404).json({ message: 'El turno no existe' });
        }

        res.status(200).json({ message: 'Turno eliminado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar el turno' });
    }
};

// Controlador para eliminar turnos de días anteriores
export const eliminarTurnosAnteriores = async () => {
    try {
        const today = new Date();
        const formattedToday = today.toISOString().split('T')[0]; // Formato: 'YYYY-MM-DD'

        const [result] = await pool.query(
            'DELETE FROM turnos_disponibles WHERE fecha < ?',
            [formattedToday]
        );

        console.log(`Eliminados ${result.affectedRows} turnos anteriores a ${formattedToday}`);
    } catch (error) {
        console.error('Error al eliminar turnos anteriores:', error);
    }
};
