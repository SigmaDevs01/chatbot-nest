/** Executado pelo Jest antes de importar AppModule, pois ConfigModule valida o ambiente durante a importação. */
process.env.SIMULATION_MODE = 'true';
process.env.WEBHOOK_TOKEN = 'test-secret';
process.env.NODE_ENV = 'test';
delete process.env.REDIS_URL;
