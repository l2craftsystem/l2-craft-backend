const createApp = require('./app');
const runMigrations = require('./migrate'); // opcional, si seguís usando migraciones
const { PORT } = require('./config');

function startServer() {
  const app = createApp();

  // Si todavía querés correr migraciones al inicio
  runMigrations();

  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

startServer();