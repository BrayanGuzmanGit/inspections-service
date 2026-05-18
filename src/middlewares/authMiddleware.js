const env = require('../config/env.config');
const AppError = require('../shared/AppError');

// Inter-service Role Middleware: Delega la autenticación y estado activo al Servicio 1
const getProfileFromEntitiesService = async (authHeader) => {
  try {
    const response = await fetch(`${env.ENTITIES_SERVICE_URL}/users/me`, {
      method: 'GET',
      headers: { 'Authorization': authHeader }
    });
    
    if (!response.ok) {
      let errData = { message: 'No autorizado por Entities Service' };
      try { 
        errData = await response.json(); 
      } 
      catch(e) {
        throw new AppError('Error conectando al MS Entities Service', 500);
      }
      
      if (response.status === 401 || response.status === 403) {
        throw new AppError(errData.message, response.status);
      }
      throw new AppError('Error conectando al MS Entities Service', 500);
    }
    
    const result = await response.json();
    console.log('Perfil obtenido de Entities Service:', result.data);
    return result.data; // req.userProfile desde BD1
  } catch(e) {
    if (e instanceof AppError) throw e;
    throw new AppError(`Http error to entities-service: ${e.message}`, 500);
  }
};

const crossServiceAuth = (...roles) => {
  return async (req, res, next) => {
    try {
      const authHeader = req.headers.authorization;
      if (!authHeader) throw new AppError('No token provisto', 401);

      // Verificamos mandándolo al MS Entities Service
      const userProfile = await getProfileFromEntitiesService(authHeader);
      
      req.user = { id: userProfile.id }; 
      req.userProfile = userProfile;   
      
      // Verificamos el rol
      if (roles.length > 0 && !roles.includes(userProfile.rol)) {
        throw new AppError(`Acceso denegado en Inspections. Requiere ser: ${roles.join(' o ')}`, 403);
      }

      if (userProfile.estado !== 'Activo') {
        throw new AppError('Usuario inactivo o congelado', 403);
      }

      next();
    } catch(err) {
      next(err);
    }
  }
}

module.exports = { crossServiceAuth };
