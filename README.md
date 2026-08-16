# Chat Application

Spring Boot 4 chat application with JWT login, private WebSocket messaging, message status, typing indicators, replies, edit/delete support, and file sharing.

## Run locally

1. Create a MySQL database named `CHAT_APP`.
2. Configure the values in `.env.example` as environment variables (or use the local defaults in `application.properties`).
3. Start the app from the project folder:

   ```powershell
   .\mvnw.cmd spring-boot:run
   ```

4. Open `http://localhost:8080/login.html`.

## Main API routes

- `POST /auth/register` — creates a standard `USER` account with `{ "username", "password" }`.
- `POST /auth/login` — returns a JWT.
- `GET /user/me`, `GET /user/all` — require `Authorization: Bearer <token>`.
- `POST /files/upload-image`, `POST /files/upload-file` — require a JWT.

The browser client uses the JWT to authenticate the WebSocket connection. Keep `JWT_SECRET`, database credentials, and uploaded files out of source control in production.
