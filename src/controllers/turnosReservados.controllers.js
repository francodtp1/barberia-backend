import pool from '../db.js';
import { limpiarTurnosDisponibles } from './turnos.controllers.js';

// Utilidades comunes
const obtenerFechaHoraActual = () => {
    const now = new Date();
    return now.toISOString().slice(0, 19).replace('T', ' ');
};


export const limpiarTurnosReservados = async () => {
    const now = obtenerFechaHoraActual();
    try {
        // Obtener IDs de usuarios con turnos vencidos
        const [usuariosConTurnosVencidos] = await pool.query(
            `SELECT DISTINCT usuarios.id FROM turnos_reservados
             JOIN turnos_disponibles ON turnos_reservados.turno_id = turnos_disponibles.id
             JOIN usuarios ON turnos_reservados.cliente_id = usuarios.id
             WHERE CONCAT(DATE_FORMAT(CONVERT_TZ(turnos_disponibles.fecha, '+00:00', @@session.time_zone), '%Y-%m-%d'), ' ', 
             turnos_disponibles.hora) < ?`,
            [now]
        );

        let usuariosActualizados = 0;
        if (usuariosConTurnosVencidos.length > 0) {
            const usuariosIds = usuariosConTurnosVencidos.map((u) => u.id);
            const [updateResult] = await pool.query(
                `UPDATE usuarios SET con_turno = FALSE WHERE id IN (?)`,
                [usuariosIds]
            );
            usuariosActualizados = updateResult.affectedRows;
        }

        // Eliminar turnos reservados vencidos
        const [deleteResult] = await pool.query(
            `DELETE turnos_reservados FROM turnos_reservados
             JOIN turnos_disponibles ON turnos_reservados.turno_id = turnos_disponibles.id
             WHERE CONCAT(turnos_disponibles.fecha, ' ', turnos_disponibles.hora) < ?`,
            [now]
        );

        const turnosEliminados = deleteResult.affectedRows;

        // Mostrar mensaje solo si hubo cambios
        if (turnosEliminados > 0 || usuariosActualizados > 0) {
            console.log(`Eliminados ${turnosEliminados} turnos reservados vencidos y actualizados ${usuariosActualizados} usuarios hasta ${now}`);
        }
    } catch (error) {
        console.error('Error al limpiar turnos reservados vencidos:', error);
    }
};


// Controlador para crear un turno reservado
export const createTurnoReservado = async (req, res) => {
    const { cliente_id, turno_id } = req.body;

    try {
        // Verificar si el cliente ya tiene un turno reservado
        const [usuario] = await pool.query(
            'SELECT con_turno FROM usuarios WHERE id = ?',
            [cliente_id]
        );

        if (usuario.length === 0) {
            return res.status(404).json({ message: 'El cliente no existe' });
        }

        if (usuario[0].con_turno) {
            return res.status(400).json({ message: 'El cliente ya tiene un turno reservado' });
        }

        // Verificar si el turno está disponible
        const [turno] = await pool.query(
            'SELECT disponible FROM turnos_disponibles WHERE id = ?',
            [turno_id]
        );

        if (turno.length === 0) {
            return res.status(404).json({ message: 'El turno no existe' });
        }

        if (!turno[0].disponible) {
            return res.status(400).json({ message: 'El turno no está disponible' });
        }

        // Crear el turno reservado
        await pool.query(
            'INSERT INTO turnos_reservados (cliente_id, turno_id) VALUES (?, ?)',
            [cliente_id, turno_id]
        );

        // Actualizar el estado del cliente y del turno
        await pool.query(
            'UPDATE usuarios SET con_turno = TRUE WHERE id = ?',
            [cliente_id]
        );

        await pool.query(
            'UPDATE turnos_disponibles SET disponible = FALSE WHERE id = ?',
            [turno_id]
        );

        res.status(201).json({ message: 'Turno reservado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al reservar el turno' });
    }
};

// Controlador para obtener todos los turnos reservados
export const getTurnosReservados = async (req, res) => {
    try {

        await limpiarTurnosReservados();
        await limpiarTurnosDisponibles();

        const [turnosReservados] = await pool.query(`
            SELECT 
                tr.id, 
                tr.cliente_id, 
                tr.turno_id, 
                DATE_FORMAT(td.fecha, '%Y-%m-%d') AS fecha, 
                TIME_FORMAT(td.hora, '%H:%i') AS hora, 
                u.nombre AS cliente_nombre
            FROM turnos_reservados tr
            INNER JOIN turnos_disponibles td ON tr.turno_id = td.id
            INNER JOIN usuarios u ON tr.cliente_id = u.id
            ORDER BY td.fecha ASC, td.hora ASC
        `);


        // Convertir a UTC explícitamente si no se está utilizando ya.
        const turnosUTC = turnosReservados.map((turno) => ({
            ...turno,
            fecha: new Date(turno.fecha).toISOString().split('T')[0], // UTC
        }));
        res.status(200).json(turnosUTC);
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al obtener los turnos reservados' });
    }
};

// Controlador para eliminar un turno reservado
export const deleteTurnoReservado = async (req, res) => {
    const { id } = req.params;

    try {
        // Obtener los datos del turno reservado antes de eliminarlo
        const [turnoReservado] = await pool.query(
            'SELECT cliente_id, turno_id FROM turnos_reservados WHERE id = ?',
            [id]
        );

        if (!turnoReservado.length) {
            return res.status(404).json({ message: 'El turno reservado no existe' });
        }

        const { cliente_id: clienteId, turno_id: turnoId } = turnoReservado[0];

        // Eliminar el turno reservado
        await pool.query(
            'DELETE FROM turnos_reservados WHERE id = ?',
            [id]
        );

        // Actualizar el estado del usuario y del turno
        await pool.query(
            'UPDATE usuarios SET con_turno = FALSE WHERE id = ?',
            [clienteId]
        );

        await pool.query(
            'UPDATE turnos_disponibles SET disponible = TRUE WHERE id = ?',
            [turnoId]
        );

        res.status(200).json({ message: 'Turno reservado eliminado exitosamente' });
    } catch (error) {
        console.error(error);
        res.status(500).json({ message: 'Error al eliminar el turno reservado' });
    }
};
