# Database Schema

The application uses **TypeORM** with `synchronize: true` in development, so tables are created/updated automatically from entities in `src/**/entities/*.entity.ts`.

This folder holds reference SQL matching the project schema:

- **schema.sql** – Full `CREATE TABLE` statements for manual MySQL setup (e.g. production migration).

To run manually:

```bash
mysql -u user -p database_name < schema/schema.sql
```

## Default seed (development)

On first run in development, the app seeds:

- **Admin user**: `admin@yogaplatform.com` / `Admin@1234`
- **Sample services**: e.g. Online Hatha Private/Group, Vinyasa Private, Offline Power Group (type, format, yoga_type on `services` only)
- **App settings**: `site_name`, `max_leads_per_day`, `enable_online_payment`, `working_hours`

Create additional admins via `POST /api/v1/auth/admin/create` (admin-only).
