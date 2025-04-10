# Functions for POTW

These are the GCP functions for the POTW project. A standard Firebase project leveraging TypeScript, Firebase Functions, and PostgreSQL.

## Project Overview

This project uses:
- TypeScript 4.9.0
- Firebase Functions 5.0.1
- Drizzle ORM 0.30.1 for database interactions
- Google Cloud Pub/Sub for event-driven architecture
- PostgreSQL for data storage
- Jest 29.7.0 for testing

## Getting Started

### Installation

`npm install` to install the dev dependencies in the root folder.

`cd functions && npm install` to move to the functions folder and install the deps there.

### Configuration

`./scripts/decrypt_secrets.sh -e=local` to decrypt the secrets/config values for the project.

### Secrets Management

The project uses **encrypted secrets** to manage environment-specific configurations
securely. The secrets are committed in their encrypted form to the repository using *
*Google Cloud KMS (Key Management Service)** for encryption and decryption.

#### How It Works:

1. **Encryption:**
    - Sensitive configurations are encrypted using GCP KMS before being committed to the
      repository.
    - This ensures that no plaintext sensitive information is stored in version control.

2. **Decryption:**
    - To use the secrets, a decryption script (`decrypt_secrets.sh`) is executed, which
      interacts with GCP KMS to securely decrypt the appropriate secrets.

3. **Updating Secrets:**
    - When secrets are updated, they are re-encrypted and a new encrypted file is
      committed to the repository.
    - This ensures that the most recent secrets are always available to team members
      with the appropriate access.

#### Decrypt Secrets Locally:

- Run the following command to decrypt the secrets for the local environment:
  ```bash
  ./scripts/decrypt_secrets.sh -e=local
  ```
  Replace `local` with the appropriate environment (`dev`, `prod`, etc.) depending on
  your needs.

> **Note:** Ensure you have the necessary GCP permissions and KMS access to perform
decryption when running the script.

#### Security Considerations:

- Only encrypted versions of secrets are stored in the repository.
- Access to decryption requires GCP IAM permissions for the relevant KMS key.
- Never commit decrypted secrets or plaintext sensitive information.

For more details, refer to the implementation of the `decrypt_secrets.sh` script or the
GCP KMS documentation.

### Running Locally

`cd functions && npm run dev` to start the functions emulator.

`npm run initLocalDev` will ensure the topics used by the functions are created.

## Database Management

The project uses PostgreSQL with Drizzle ORM. Database credentials are stored in the decrypted environment files.

### Postgres Setup

### Setting Up PostgreSQL

To set up PostgreSQL for this project, follow the steps below:

1. **Install PostgreSQL:**
    - Download and install PostgreSQL from
      the [official website](https://www.postgresql.org/download/) or using your
      system's package manager (e.g., `brew install postgres` for macOS).

2. **Start PostgreSQL Service:**
    - Ensure that the PostgreSQL service is running. You can start it with:
      ```bash
      brew services start postgresql
      ```
      Or use the appropriate method for your operating system.

3. **Create a Database:**
    - Open the PostgreSQL CLI (`psql`) or use any SQL client (e.g., PgAdmin or DBeaver).
    - Create a database with the desired name. For example:
      ```sql
      CREATE DATABASE potw;
      ```

4. **Configure Database Credentials:**
    - Make sure to set up a user with the necessary permissions. For example:
      ```sql
      CREATE USER potw_user WITH ENCRYPTED PASSWORD '{password from secrets file}';
      GRANT ALL PRIVILEGES ON DATABASE potw_project TO potw_user;
      ```

5. **Store Credentials in Encrypted Secrets:**
    - Add the database host, port, name, user, and password to your encrypted secrets
      file so they are securely managed.
    - Example configuration format:
      ```json
      {
        "DATABASE_HOST": "localhost",
        "DATABASE_PORT": "5432",
        "DATABASE_NAME": "potw",
        "DATABASE_USER": "potw_user",
        "DATABASE_PASSWORD": "your_password"
      }
      ```

6. **Run Decryption for Local Setup:**
    - Decrypt the secrets for local development:
      ```bash
      ./scripts/decrypt_secrets.sh -e=local
      ```

7. **Test Connection:**
    - Use a database client or the Drizzle ORM configuration to ensure the application
      can connect to the database successfully. For example, run a test query.

8. **Apply Migrations:**
    - Generate or run database migrations to ensure the schema matches the current
      application needs:
      ```bash
      cd functions
      npm run migrations:run:local
      ```

By completing the steps above, your PostgreSQL setup should be ready for local
development and future integration with the cloud environment.

### Database Migrations

When modifying data models, you need to create and run migrations:

`cd functions && npm run migrations:generate --name=<migration name>` to generate the migrations.

`cd functions && npm run migrations:run:<local|dev>` to run the migrations against local or dev environments.

## Project Structure

- `/functions`: Contains all Firebase Cloud Functions code
- `/scripts`: Utility scripts for development workflow
- Environment-specific configuration is managed through encrypted secrets

## CI/CD

The project likely uses Firebase deployment pipelines. Additional CI/CD documentation may be available in the deploy scripts or documentation.

## Additional Resources

- [Firebase Functions Documentation](https://firebase.google.com/docs/functions)
- [Drizzle ORM Documentation](https://orm.drizzle.team/docs/overview)
- [TypeScript Documentation](https://www.typescriptlang.org/docs/)