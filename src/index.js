import app from './app.js';
import { PORT } from './config.js';
import './db.js';
import { eliminarTurnosAnteriores } from './controllers/turnos.controllers.js';
import schedule from 'node-schedule';

async function main() {

  // Asegúrate de escuchar en todas las interfaces (0.0.0.0) y en el puerto correcto
  app.listen(PORT || 4486, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });

  // Programa la tarea diaria para ejecutar a las 00:01 AM 
  schedule.scheduleJob('1 0 * * *', async () => {
    console.log('Ejecutando limpieza de turnos anteriores...'); 
    await eliminarTurnosAnteriores();
  });

}

main();

 