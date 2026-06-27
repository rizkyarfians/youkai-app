require('./config/loadEnv')();

const app = require('./app');

const PORT = process.env.PORT || 5000;

async function startServer() {
  try {
    const { testFirebaseConnection } = require('./config/firebase');
    await testFirebaseConnection();

    app.listen(PORT, () => {
      console.log(`Youkai Management API running on port ${PORT}`);
    });
  } catch (error) {
    console.error('Failed to start server:', error.message);
    process.exit(1);
  }
}

startServer();
