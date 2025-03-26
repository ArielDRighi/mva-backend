# Guía de Nomenclatura y Estructura para GitFlow en Proyecto MVA

## Estructura de Ramas

### Tipos de Ramas

#### Ramas Principales

- **main**: Código en producción
- **develop**: Última versión estable para desarrollo

#### Tipos de Ramas de Características

- `feature/BACKEND-001-setup-project`
- `feature/FRONTEND-002-client-management`
- `bugfix/BACKEND-005-fix-vehicle-repository`
- `hotfix/AUTH-001-jwt-security-patch`
- `release/v1.0.0`

## Estructura de Commits

### Formato de Mensaje de Commit

```
<tipo>(<alcance>): <descripción corta>

[Cuerpo del commit opcional]

JIRA: BACKEND-001
```

### Tipos de Commits

- **feat**: Nueva característica
- **fix**: Corrección de errores
- **docs**: Cambios en documentación
- **style**: Formateo de código
- **refactor**: Restructuración de código
- **test**: Añadir o corregir tests
- **chore**: Tareas de mantenimiento

### Ejemplos de Commits

#### Commit Simple

```
feat(clientes): agregar registro de nuevos clientes

- Implementar endpoint de registro
- Añadir validaciones de datos

JIRA: BACKEND-002
```

#### Commit Complejo

```
fix(autenticacion): corregir validación de token JWT

- Mejorar manejo de expiración de tokens
- Agregar log de intentos fallidos
- Refactorizar middleware de autenticación

JIRA: BACKEND-012
```

## Flujo de Trabajo con GitFlow

### Crear rama desde develop

```bash
git checkout develop
git pull origin develop
git checkout -b feature/BACKEND-001-setup-project
```

### Desarrollo y Commits

```bash
git add .
git commit -m "feat(setup): configurar estructura inicial del proyecto

- Inicializar proyecto NestJS
- Configurar TypeORM
- Añadir configuración inicial de base de datos

JIRA: BACKEND-001"
```

### Push de Rama

```bash
git push -u origin feature/BACKEND-001-setup-project
```

### Pull Request

**Título**: BACKEND-001: Configurar estructura del proyecto

**Descripción**:

```
## Objetivo
Configurar la estructura inicial del proyecto backend

## Cambios
Inicializado proyecto NestJS
Configurado TypeORM
Añadida configuración inicial de base de datos

## Checklist
[ ] Código revisado
[ ] Pruebas unitarias añadidas-
[ ] Documentación actualizada

## JIRA
BACKEND-001
```

## Reglas Adicionales

- Commits pequeños y frecuentes
- Descripción clara y concisa
- Referenciar siempre el ticket de JIRA
- Usar verbos en español en infinitivo
- Evitar commits con muchos cambios diferentes

## Herramientas Recomendadas

- **commitizen**: Ayuda a formatear commits
- **husky**: Validación de mensajes de commit
- **lint-staged**: Formateo de código antes de commit
