const createApp = require('./app');
const { connectDatabase } = require('./database');
const runMigrations = require('./migrate');
const { PORT } = require('./config');

function startServer() {

  connectDatabase();

  runMigrations();

  const app = createApp();

  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });

}

startServer();