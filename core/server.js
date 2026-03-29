function startServer() {
  // connectDatabase();  <-- eliminar o comentar
  app.listen(PORT, () => {
    console.log(`Servidor corriendo en puerto ${PORT}`);
  });
}

startServer();