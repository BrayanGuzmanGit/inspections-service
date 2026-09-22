# Servicio de inspecciones

Backend desarrollado con Node.js y Express.js para la gestión de solicitudes e inspecciones fitosanitarias y técnicas dentro de un sistema web orientado al proceso de inspección para la exportación de productos hortofrutícolas.

Este servicio forma parte de una arquitectura orientada a servicios y se encarga de gestionar la lógica específica relacionada con las solicitudes de inspección, asignación y realización de inspecciones técnicas y fitosanitarias.

## 🎯 Problema que resuelve

El proceso de inspección para la exportación de productos hortofrutícolas requiere coordinar solicitudes, asignar técnicos y registrar la información obtenida durante las inspecciones.

El manejo de esta información puede involucrar diferentes actores y procesos, por lo que es necesario contar con una herramienta que permita centralizar las solicitudes y facilitar el seguimiento de las inspecciones.

## 📌 Alcance del proyecto

El servicio abarca la gestión de:

- Solicitudes de inspección.
- Inspecciones técnicas.
- Inspecciones fitosanitarias.
- Asignación de técnicos.
- Seguimiento del estado de las inspecciones.
- Información relacionada con lotes y conteo de plagas.
- Consulta de información de usuarios y lugares de producción mediante `entities-service`.

El acceso a las funcionalidades está controlado según el rol del usuario.

## 💡 Cómo aborda el problema

La solución permite digitalizar parte del proceso de gestión de inspecciones mediante una API que:

- Permite a los productores solicitar inspecciones.
- Permite a los funcionarios gestionar solicitudes de inspecciones.
- Permite asignar técnicos y fechas para las inspecciones.
- Permite a los técnicos consultar las inspecciones que tienen asignadas.
- Permite registrar inspecciones técnicas.
- Permite registrar inspecciones fitosanitarias por lote.
- Permite registrar y actualizar conteos relacionados con plagas.
- Permite consultar información complementaria desde `entities-service`.
- Mantiene separada la lógica de inspecciones de la gestión de las entidades del sistema.

De esta manera, el servicio centraliza la lógica relacionada con las inspecciones y facilita el seguimiento de su estado y resultados.

## 🚀 Características

- Asignación de técnicos.
- Gestión de inspecciones técnicas.
- Gestión de inspecciones fitosanitarias.
- Registro de información por lote.
- Registro y actualización de conteos de plagas.
- Autenticación y autorización mediante el servicio de `entities-service`.
- Persistencia de datos mediante PostgreSQL/Supabase.
- Comunicación entre servicios mediante APIs REST.

## 🛠️ Tecnologías

- Node.js
- Express.js
- JavaScript
- PostgreSQL
- Supabase
- APIs REST
- dotenv
- CORS

## 🏗️ Arquitectura

El proyecto utiliza una arquitectura por capas para separar las responsabilidades de cada componente y fue desarrollado siguiendo la metodología en cascada.

#### Routes

Definen los endpoints disponibles y dirigen las solicitudes hacia los controladores correspondientes.

#### Middlewares

Se encargan de tareas como autenticación, autorización y validación del acceso según el rol del usuario mediante consultas a `entities-service`.

#### Controllers

Gestionan las solicitudes HTTP, obtienen los datos y delegan la lógica de negocio a los servicios correspondientes.

#### Services

Contienen la lógica de negocio relacionada con las solicitudes e inspecciones y coordinan la comunicación con otros servicios.

#### Repositories

Encapsulan el acceso a los datos y la interacción con Supabase.

## 🔐 Autenticación y autorización

La autenticación y autorización de este servicio se realiza mediante integración con `entities-service`.

El middleware `crossServiceAuth` recibe el token enviado por el cliente y consulta a `entities-service` para obtener y validar el perfil del usuario.

A partir de esta información se valida:

- Identidad del usuario.
- Estado del usuario.
- Rol del usuario.
- Permisos necesarios para acceder al endpoint.

Esto permite que `inspections-service` utilice la información de usuarios gestionada por `entities-service` sin duplicar la lógica de autenticación y gestión de perfiles.

## 👥 Roles

Los principales roles utilizados por este servicio son:

- **Productor:** Puede solicitar inspecciones y consultar inspecciones asociadas a sus solicitudes.
- **Funcionario:** Puede consultar y gestionar solicitudes de inspección.
- **Técnico:** Puede consultar las inspecciones asignadas y registrar los resultados de las inspecciones.

## 🔗 Integración con otros servicios

Este sistema está compuesto por dos servicios backend:

- **Entities Service:** Gestiona usuarios, productores, predios, lugares de producción, lotes, cultivos, plagas y demás entidades del sistema.
- **Inspections Service:** Gestiona las solicitudes y la lógica específica de las inspecciones.

`inspections-service` consume información de `entities-service` mediante APIs REST.

Durante el proceso de una inspección, este servicio puede consultar:

- Si un lugar de producción tiene un predio central.
- Los lotes asociados a un lugar.
- Información de un lugar de producción.
- Información de usuarios y técnicos.

También utiliza información obtenida desde `entities-service` para complementar las respuestas de las inspecciones asignadas.

**Servicio relacionado:**

- [Entities Service](https://github.com/BrayanGuzmanGit/entities-service5to)

## 📋 Procesos gestionados

### Solicitudes de inspección

El servicio permite:

- Crear solicitudes de inspección.
- Consultar solicitudes.
- Actualizar el estado de una solicitud.
- Asignar un técnico.
- Definir la fecha de inspección.
- Eliminar o cambiar el estado de una solicitud.

Antes de crear una solicitud, el servicio verifica información del lugar de producción mediante `entities-service`.

### Inspecciones técnicas

Permite:

- Consultar inspecciones técnicas asignadas.
- Registrar los resultados de una inspección técnica.
- Asociar una inspección con un técnico.
- Consultar información relacionada con el lugar y productor.

### Inspecciones fitosanitarias

Permite:

- Consultar inspecciones fitosanitarias asignadas.
- Registrar información de la inspección por lote.
- Registrar el estado fenológico y porcentaje de infestación.
- Registrar conteos de plagas.
- Actualizar conteos existentes.
- Finalizar la inspección.

## 🔌 Endpoints principales

El servicio expone sus endpoints principales bajo `/api/inspections`.

### 📝 Solicitudes de inspección

| Método | Endpoint | Rol | Descripción |
|---|---|---|---|
| POST | `/api/inspections/solicitudes` | Productor | Crea una solicitud de inspección. |
| GET | `/api/inspections/solicitudes` | Funcionario | Consulta las solicitudes de inspección. |
| PATCH | `/api/inspections/solicitudes/:idsolicitud` | Funcionario | Actualiza una solicitud, incluyendo su estado, técnico y fecha. |
| DELETE | `/api/inspections/solicitudes/:idsolicitud` | Funcionario | Actualiza el estado de una solicitud. |

### 🔧 Inspecciones técnicas

| Método | Endpoint | Rol | Descripción |
|---|---|---|---|
| GET | `/api/inspections/tecnica/asignadas` | Técnico / Productor | Consulta las inspecciones técnicas asignadas o asociadas al usuario. |
| PATCH | `/api/inspections/tecnica/asignadas` | Técnico | Registra la información de una inspección técnica. |

### 🌱 Inspecciones fitosanitarias

| Método | Endpoint | Rol | Descripción |
|---|---|---|---|
| PATCH | `/api/inspections/fitosanitaria/:idinspeccion/lote/:idlote` | Técnico | Registra la inspección fitosanitaria de un lote. |
| PATCH | `/api/inspections/fitosanitaria/:idinspeccion/terminar` | Técnico | Finaliza una inspección fitosanitaria. |

###  Estado del servicio

| Método | Endpoint | Acceso | Descripción |
|---|---|---|---|
| GET | `/api/health` | Público | Verifica que el servicio se encuentre disponible. |

## ⚙️ Requisitos

Para ejecutar el proyecto necesitas:

- Node.js
- pnpm
- Una instancia de Supabase configurada
- `entities-service` disponible para la comunicación entre servicios
- Variables de entorno necesarias para la conexión

## 📦 Instalación

Clona el repositorio:
```bash
git clone https://github.com/BrayanGuzmanGit/inspections-service.git
```
Accede al proyecto:
```
cd inspections-service
```
Instala las dependencias:
```
pnpm install
```
Variables de entorno:
Crea un archivo .env y configura las variables de entorno.
```
PORT=3002
SUPABASE_URL=tu_url_de_supabase
SUPABASE_ANON_KEY=tu_clave_de_supabase
ENTITIES_SERVICE_URL=http://localhost:3001/api
```

Ejecución:
Ejecuta el servidor mediante:
```
node src/index.js
```
<p align="center"> <img src="https://img.shields.io/badge/Node.js-339933?style=for-the-badge&logo=nodedotjs&logoColor=white" alt="Node.js"> <img src="https://img.shields.io/badge/Express.js-000000?style=for-the-badge&logo=express&logoColor=white" alt="Express.js"> <img src="https://img.shields.io/badge/JavaScript-F7DF1E?style=for-the-badge&logo=javascript&logoColor=black" alt="JavaScript"> <img src="https://img.shields.io/badge/PostgreSQL-4169E1?style=for-the-badge&logo=postgresql&logoColor=white" alt="PostgreSQL"> <img src="https://img.shields.io/badge/Supabase-3FCF8E?style=for-the-badge&logo=supabase&logoColor=white" alt="Supabase"> </p> 
