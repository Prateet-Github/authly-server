import env from './config/env.js';
import app from './app.js';
import connectDb from './config/db.js';

const startServer = async() => {
try {

  await connectDb();

  const server = app.listen(env.PORT,() => {
    console.log(`Server running in ${env.NODE_ENV} mode on port ${env.PORT}`)
  })

  server.on("error", (error) => {
    console.error("Server startup error:", error);
    process.exit(1);
  });


} catch (error) {
  console.error("Unexpected startup error:", error);
  process.exit(1);
}
};

startServer();

