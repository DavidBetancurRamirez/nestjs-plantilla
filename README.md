# Plantilla Nest.js
Plantilla usada para proyectos de nest.js


## Ramas (opciones)
### sql
Cuenta con una configuracion base para ser usada con una base de datos relacional (postgress - sql)

### nosql
Cuenta con una configuracion base para ser usada con una base de datos no relacional (mongodb - nosql)


## Ejecutar
1. Variables necesarias en el .env:

Con cualquier rama:
```
JWT_SECRET=
JWT_REFRESH_SECRET=
```

Para rama **sql**:
```
DB_TYPE="sql"
DB_HOST=
DB_PORT=
DB_USERNAME=
DB_PASSWORD=
DB_NAME=
DB_SSL=
  # Variables para servicio pgadmin (contenedor de docker)
PGADMIN_EMAIL=
PGADMIN_PASSWORD=
PGADMIN_PORT=
```

Para rama **nosql**:
```
DB_TYPE="nosql"
MONGO_URI=
  # Variables para servicio mongo-express (contenedor de docker)
MONGO_INITDB_ROOT_USERNAME=
MONGO_INITDB_ROOT_PASSWORD=
MONGO_PORT=
MONGO_EXPRESS_PORT=
```

2. Levantar Base de Datos con docker:
```
docker compose up -d
```

3. Descargar dependencias:
```
npm i
```

4. Ejecutar modo dev:
```
npm run dev
```


## Contenido
- *Documentación con swagger*
- *Tipos de usuarios*
  1. **user:** por defecto
  2. **admin:** permiso para hacer todo


## Modulos
### Auth
**Rutas:**
- **Post** *(/auth/register) Register:* Crear nuevo usuario y devuelver sus credenciales
- **Post** *(/auth/login) Login:* Devuelver las credenciales; por autenticación email-password
- **Post** *(/auth/refresh-token) Refresh Token:* Devuelver las credenciales; con refreshToken

---
### User
**Rutas:**

*Requieren Rol user o admin*
- **Get** *(/user) Profile:* Devuelve la informacion del usuario que hace la petición
- **Patch** *(/user) Update:* Actualizar al usuario que hace la petición
- **Delete** *(/user/:id) Remove:* Eliminar al usuario que hace la petición

*Requieren Rol admin*
- **Get** *(/user/users) FindAll:* Devuelve todos los usuarios; ordenados por id
- **Get** *(/user/:id) FindOne:* Devuelve el usuario con el id proporcionado
- **Post** *(/user) CreateUser:* Crear un usuario
- **Patch** *(/user/:id) UpdateUser:* Actualizar un usuario
- **Delete** *(/user/:id) RemoveUser:* Eliminar un usuario


## Info util
### Crear nuevo proyecto basado en esta plantilla
1. *Clonar la plantilla:*
```
git clone https://github.com/DavidBetancurRamirez/nestjs-plantilla.git nuevo-proyecto
```

2. *Agregar la plantilla como un repositorio remoto adicional (upstream):*
```
git remote add upstream https://github.com/DavidBetancurRamirez/nestjs-plantilla.git
```

---
### Actualizar cambios desde la plantilla
1. *Obtener cambios de la plantilla (upstream):*
```
git fetch upstream
```

2. *Aplicar cambios de la plantilla (upstream):*

Se debe de seleccionar la rama (opcion) que se este usando.
Si se usa la rama **sql**:
```
git merge upstream/sql
```

Si se usa la rama **nosql**:
```
git merge upstream/nosql
```

3. *Resolver conflictos:*
Puede que algunos cambios no se hagan de manera automatica y generen conflictos y halla que resolverlos y realizar un commit adicional

---
### Generar un modulo por comandos:
```
nest g res name --no-spec
```

---
### Para implementar la autenticación en otro modulo:
*example.module.ts*
```
@Module({
  imports: [AuthModule],
})
export class ExampleModule {}
```

---
### Para usar modulo con sql:
*example.module.ts*
```
@Module({
  imports: [TypeOrmModule.forFeature([Example])],
})
export class ExampleModule {}
```
