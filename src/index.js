const app = require('./server');
const env = require('./config/env.config');

app.listen(env.PORT, () => {
  console.log(`🚀 Inspections Service corriendo en el puerto ${env.PORT}`);
});
