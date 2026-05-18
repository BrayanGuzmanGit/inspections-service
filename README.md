  # Sistema Integrador de Inspecciones - ICA (Backend)
  *(Arquitectura de Microservicios, MVC Extendido y API REST)*

  ¡Bienvenido! Este `README.md` es una **guía técnica y educativa profunda**. Está diseñada para un estudiante de Ingeniería de Sistemas interesando en las bases teóricas y la ejecución práctica de un software empresarial, web y orientado a servicios.

  Este proyecto se aleja de la clásica estructura de "todo en un mismo archivo" y aplica conceptos modernos de escalabilidad, seguridad e **Inversión de Control (IoC)** (en espíritu, mediante la modularización). 

  A continuación, la anatomía completa del sistema.

  ---

  ## 1. Topología: Microservicios vs Monolito

  El proyecto consta de dos carpetas (`entities-service` e `inspections-service`). Técnicamente, son **dos servidores web independientes de Node.js**.

  ### Fundamento Técnico
  - **El Monolito:** En un sistema monolítico, todos los dominios (Usuarios, Cultivos, Inspecciones) comparten la misma memoria RAM, el mismo hilo de ejecución y la misma base de datos.
    - *Problema:* El hilo principal de Node.js es de un solo subproceso (*single-threaded*). Si un algoritmo pesado en "Inspecciones" bloquea el *Event Loop*, los usuarios no podrán hacer "Login" en la sección de Entidades.
  - **La solución (Microservicios):** Al separarlos, aplicamos el patrón **Strangler/Separation of Concerns**. `entities-service` gestiona los catálogos y actores del sistema usando el puerto `:3001` y su propia base de datos, mientras que `inspections-service` opera de forma completamente autónoma en el puerto `:3002`.
    - *Ventaja técnica:* Puedes subir ambos servicios a contenedores Docker. Si el día de mañana se hacen 10,000 inspecciones por minuto, configuras Kubernetes para tener 5 instancias de `inspections-service` y solo 1 de `entities-service`, optimizando costos de CPU y RAM de forma asimétrica.

  ---

  ## 2. La Capa de Transporte: Express.js y el Event Loop

  Cada servidor está construido sobre `Express.js`. Todo fluye a través del ciclo de vida del protocolo HTTP: *Request* (`req`) y *Response* (`res`).

  Todas las funciones del sistema usan la palabra clave **`async / await`**. 
  - **¿Por qué?** Node.js usa operaciones I/O no bloqueantes (Non-blocking I/O). Cuando el servidor le pregunta algo a Supabase (una petición por red que tarda ms), la CPU de tu servidor no se queda inactiva. Devuelve el control al *Event Loop* para atender a otro usuario, y cuando Supabase responde, la función retoma su ejecución.

  ---

  ## 3. Arquitectura Limpia: El Patrón Controller - Service - Repository

  Dentro de `src/modules/...` usamos una adaptación del patrón de diseño por capas. Evitamos el acoplamiento fuerte.

  ### 3.1. Rutas (`Route`) e Interceptores (`Middleware`)
  La ruta es el punto de entrada, ej. `POST /api/users/login`. 
  Antes de llegar al controlador, pasa por una "aduana": **Los Middlewares**.
  - **Explicación Técnica:** Un Middleware (`req, res, next`) examina la petición. En nuestro código, el `authMiddleware` busca el encabezado HTTP `Authorization: Bearer <token>`. Si es inválido, rechaza la HTTP Request con un código `401 Unauthorized` bloqueando el paso e impidiendo que tu lógica principal gaste CPU. Si es válido, llama a `next()` para ceder el control.

  ### 3.2. La Capa HTTP (`Controller`)
  El archivo `Controller.js` es el encargado **únicamente** de la comunicación HTTP. 
  No debería saber cómo calcular un descuento ni cómo se llama la base de datos. Solo sabe leer un JSON y devolver un JSON.
  ```javascript
  // Ejemplo conceptual en nuestro userController
  async login(req, res, next) {
    try {
      const { email, password } = req.body; // Pura manipulación de entrada web
      const result = await userService.login(email, password); // Delega la responsabilidad
      return ApiResponse.success(res, result, 'Login exitoso'); // Formatea la salida web estándar
    } catch (error) {
      next(error); // Delega el choque a una central de errores
    }
  }
  ```

  ### 3.3. La Capa de Dominio (`Service`)
  La "Lógica de Negocio". Si necesitamos implementar una regla estricta: *"Un registro de Cultivo debe pesar menos de 2 toneladas y el creador debe tener el rol Productor"*, esa validación imperativa va en el `userService` o `cropService`.
  Si usáramos la arquitectura "hamburguesa" y todo estuviera en el Controller, sería imposible re-usar la lógica de registrar usuarios si quisiéramos implementarlo vía comandos de consola (CLI) en un futuro, pues un CLI no tiene `req` ni `res`.

  ### 3.4. La Capa de Datos (`Repository`)
  El patrón Repositorio es un escudo. Su función es "encapsular la tecnología de persistencia". 
  Actualmente, el `userRepository.js` contiene algo así: `supabase.auth.signUp()`.
  - **Ventaja técnica gigantesca:** Si en 3 años, Supabase se vuelve obsoleto y deciden migrar a una base de datos propia en Oracle o Firebase, **sólamente editas los archivos Repository**. El Controlador y el Servicio ni siquiera notarán el cambio de tecnología del motor de la base de datos. Esto es el Santo Grial de un software mantenible.

  ---

  ## 4. Respuestas unificadas y Manejo de Errores

  En proyectos amateures, cada programador responde cómo se le da la gana (`res.send()`, `res.json({error: "ups" })`).
  Nosotros utilizamos la clase `ApiResponse`. Esto es un **DTO (Data Transfer Object)** implícito. 
  Garantiza que el Frontend de ICA siempre va a recibir el mismo contrato JSON, indistintamente si la petición fue un éxito o un error:
  ```json
  {
    "success": true, // o false
    "message": "Operación exitosa",
    "data": { ... } // objeto nulo si es un error
  }
  ```
  Además, en cualquier parte del código que un programa falle, simplemente se hace `throw error` (el bloque catch invoca a `next(error)`). En el archivo central `server.js` hay un Middleware atrapa-errores que procesa ese desplome y evita que Node.js colapse con el famoso `UnhandledPromiseRejection`, regresando educadamente un error 500 al cliente web.

  ---

  ## 5. Decisiones Criptográficas y de Seguridad (Supabase Auth)

  **Por qué no guardamos las contraseñas en una tabla de tu código:**
  Guardar contraseñas es un riesgo masivo (incluso hasheadas con bcrypt/salt). Aprovechamos **Supabase como un BaaS (Backend as a Service)**.
  - **Autenticación "Stateless":** El sistema NO GUARDA sesiones en RAM. Usa **JWT (JSON Web Tokens)**.
    - El token que nos da Supabase se divide en 3 partes cifradas criptográficamente (Base64Url): El *Header* (algoritmo HS256), el *Payload* (id_user, email, caducidad) y la *Signature* (Firma digital intocable fabricada por el servidor secreto). 
    - Al no haber estado/sesión guardada en nuestra RAM, el servidor es 100% "stateless", lo cual es **obligatorio en arquitecturas REST**.

  ---

  ## 6. Variables de Entorno (`.env`)

  ```env
  SUPABASE_URL=https://tuid.supabase.co
  SUPABASE_ANON_KEY=eyJhbG... // <- Nunca expuesto
  ```
  En ingeniería de sistemas existe el concepto del Manifiesto de las 12 Aplicaciones (Twelve-Factor App). Una regla vital estipula que **la configuración que varía entre escenarios de despliegue se guarda en el entorno, NO en el código fuente**.
  Para pasar del entorno de "Pruebas" a "Producción Comercial", no editamos `config.js`, simplemente cambiamos el contenido del `.env`. También protege el código de crawlers maliciosas en GitHub.

  ---

  ## 7. Retos y Vulnerabilidades para el Ingeniero a Futuro

  Para pasar de un código excelente a un nivel Enterprise / Bancario, el proyecto demanda lo siguiente:

  1. **Problemas del Modelo Distribuido (Integridad Referencial):** 
    - Como Inspecciones está en el Servidor 2, y Predios en el Servidor 1... ¿Cómo aseguramos desde la base de datos 2 que el Predio existe? En una DB Monolítica usas un `FOREIGN KEY`. En microservicios requieres llamadas RPC o Sagas de Mensajería (Kafka/RabbitMQ) para sincronizar bases de datos distribuidas (Patrón *Event-driven Architecture*).
  2. **Ataques de Tipo DoS y Fuerza Bruta:** 
    - Añadir una biblioteca como `helmet` para inyectar cabeceras HTTP de seguridad militar (Anti Click-jacking).
    - Añadir `express-rate-limit` para bloquear IPs que hagan `.login()` más de 5 veces en 1 minuto.
  3. **Serialización y Validación de Schemas (OWASP):** 
    - Un usuario agresivo podría enviar al JSON del API un código SQL dañino, o texto de 100 Megabytes haciéndote gastar RAM (Un ataque de Desbordamiento). Debes agregar un validador léxico (como `Zod` o `Joi`) dentro de las rutas, exigiendo que cada `req.body.password` obligatoriamente sea de tipo `string` y no mayor a 30 caracteres, descartando el paquete de red antes de que lo use Controller.

  ---

  ## Instrucciones Operativas Rápidas

  ```bash
  # Terminal 1 - Microservicio 1 (Entidades y Catálogo)
  cd entities-service && npm install && node src/index.js 

  # Terminal 2 - Microservicio 2 (Core Operativo de Inspecciones)
  cd inspections-service && npm install && node src/index.js 
  ```
  Ambos se apoyan conceptualmente. La interfaz web (`test-ui.html` en la raíz) actúa como el cliente consumiendo ambos endpoints como un orquestador.