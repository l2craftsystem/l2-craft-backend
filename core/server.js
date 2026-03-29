const createApp = require('./app');
const { PORT } = require('./config');

function startServer() {
  const app = createApp();

  app.listen(PORT, () => {
    console.log(`Servidor corriendo en http://localhost:${PORT}`);
  });
}

startServer();