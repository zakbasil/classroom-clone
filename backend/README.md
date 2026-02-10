# Classroom Clone – .NET Backend

ASP.NET Core 8 Web API backend for the Classroom Clone UI. It provides REST APIs for classes, assignments, quizzes, question sets, materials, announcements, and JWT authentication.

## Requirements

- [.NET 8 SDK](https://dotnet.microsoft.com/download/dotnet/8.0)

## Quick Start

```bash
cd backend/ClassroomClone.Api
dotnet run
```

By default the API uses **SQLite** with a local file `classroom.db` and runs at **http://localhost:5081** (or https://localhost:7255 with the `https` profile).

- If the database does not exist, it is created and migrations are applied on first run.

### Using SQL Server LocalDB

To use **(localdb)\\MSSQLLocalDB** instead of SQLite:

1. Set `ConnectionStrings:DefaultConnection` in **appsettings.Development.json** to:
   ```json
   "Data Source=(localdb)\\MSSQLLocalDB;Initial Catalog=ClassroomClone;Integrated Security=True;Connect Timeout=30;Encrypt=False;TrustServerCertificate=False;"
   ```
2. Ensure no other instance of the API is running (so the project can build), then run the API with the Development environment. Migrations will create the `ClassroomClone` database and tables on first run.

To apply migrations manually (e.g. without starting the API):
```bash
cd backend/ClassroomClone.Api
dotnet ef database update
```
(Requires [EF Core tools](https://learn.microsoft.com/en-us/ef/core/cli/dotnet): `dotnet tool install --global dotnet-ef`)

## Configuration

- **appsettings.json** / **appsettings.Development.json**
  - `ConnectionStrings:DefaultConnection` – leave empty for SQLite (`Data Source=classroom.db`). For **SQL Server LocalDB**, use the connection string above. For **PostgreSQL**, set to your connection string (e.g. `Host=localhost;Database=classroom;Username=...;Password=...`).
  - `Jwt:Key` – secret for signing JWTs (use a long, random value in production).
  - `Jwt:Issuer` / `Jwt:Audience` – token issuer and audience.
  - `Cors:Origins` – comma-separated origins allowed for CORS (e.g. your Vite dev server).

## API Overview

All authenticated endpoints require the header: `Authorization: Bearer <token>`.

### Auth (no auth required)

- `POST /api/auth/register` – body: `{ "email", "password", "name" }` → returns `{ "token", "userId", "email", "name" }`
- `POST /api/auth/login` – body: `{ "email", "password" }` → returns same shape

### Classes

- `GET /api/classes` – current user’s classes
- `GET /api/classes/{id}` – class by id
- `GET /api/classes/by-code/{code}` – class by stream code (e.g. for join)
- `POST /api/classes` – create class
- `POST /api/classes/join` – body: `{ "streamCode" }` – join by code

### Enrollments

- `GET /api/enrollments/class/{classId}` – class members (profiles)

### Profiles

- `POST /api/profiles/by-ids` – body: `["userId1", "userId2"]` – get profiles by user ids

### Assignments

- `GET /api/assignments/class/{classId}` – assignments for a class

### Quizzes

- `GET /api/quizzes/{id}` – quiz by id (with questions)
- `POST /api/quizzes` – create quiz (and linked assignment)
- `GET /api/quizzes/{quizId}/submissions` – submissions (creator only)
- `POST /api/quizzes/{quizId}/submit` – submit attempt

### Question sets

- `GET /api/questionsets/{id}` – question set by id
- `POST /api/questionsets` – create question set (and linked assignment)

### Materials

- `GET /api/materials/class/{classId}` – materials for a class
- `POST /api/materials` – create material

### Announcements

- `GET /api/announcements/class/{classId}` – announcements for a class
- `POST /api/announcements` – create announcement

Request/response bodies use **camelCase** JSON to align with the frontend.

## Connecting the frontend

The UI in `src` currently uses Supabase. To use this .NET backend instead:

1. Point the app’s API base URL to this backend (e.g. `http://localhost:5081`).
2. Use the auth endpoints above for login/register and store the JWT (e.g. in memory or localStorage).
3. Send the JWT on each request in `Authorization: Bearer <token>`.
4. Replace or adapt `src/lib/database.ts` (and any Supabase client usage) to call these REST endpoints instead of Supabase.

## Database

- **SQLite** (default): no extra setup; `classroom.db` is created in the project directory.
- **SQL Server LocalDB**: set `ConnectionStrings:DefaultConnection` in appsettings.Development.json as above; run the app or `dotnet ef database update`; migrations create the `ClassroomClone` database and tables.
- **PostgreSQL**: set `ConnectionStrings:DefaultConnection` and run the app; migrations run automatically.

To reset the database (e.g. after schema changes or for a clean start):

- SQLite: delete `classroom.db` and run the app again (migrations will recreate tables).
- If you change the model and need a new migration:  
  `dotnet ef migrations add <MigrationName>`  
  Then run the app so migrations are applied.

## Project structure

- **Models/** – entities (User, Profile, Class, Enrollment, Assignment, Quiz, QuestionSet, Material, Announcement, QuizSubmission, QuestionSetSubmission).
- **Data/AppDbContext.cs** – EF Core context and configuration.
- **DTOs/** – request/response types for the API.
- **Controllers/** – API endpoints.
- **Services/AuthService.cs** – registration, login, JWT generation.
- **Extensions/ClaimsExtensions.cs** – current user id from JWT.
