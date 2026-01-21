# CXWUD AIMS E-Commerce

Full-stack e-commerce system for the CXWUD domain. The repository contains a Spring Boot backend and a React + Vite frontend. It supports product browsing for Books, CDs, DVDs, and Newspapers, cart and checkout, orders, payments (PayPal and VietQR/PayOS), admin/PM dashboards, and email notifications.

## Repository Layout
- `cxwud-backend/` Spring Boot backend (REST API, auth, payments, notifications, migrations)
- `cxwud-frontend/` React + Vite frontend (customer UI + admin/PM dashboard)
- `data/` local data assets (if used by your setup)

## Key Features
Backend:
- Product catalog with type-specific attributes (Book, CD, DVD, Newspaper)
- Cart with session-based access and stock validation
- Order creation, delivery info updates, and admin order review
- Payment flows with PayPal and VietQR/PayOS, plus webhook endpoints
- User authentication with JWT stored in HttpOnly cookies
- Admin endpoints for users, roles, product management, product types
- Email notification outbox and templates

Frontend:
- Public storefront: landing, product list, product detail, cart, checkout
- Payment flow screens (success/cancel) and order confirmation/details
- Admin dashboard: user management
- Product manager dashboard: product and product type management, statistics

## Tech Stack
Backend:
- Java 17, Spring Boot 3.2
- Spring Web, JPA, Security, Validation, Mail, Redis
- Liquibase for database migrations
- PostgreSQL (primary DB) and Redis (cache/session)
- PayPal and VietQR/PayOS integrations
- Cloudinary for image uploads

Frontend:
- React 18 + TypeScript
- Vite 7
- React Router
- Axios
- Recharts for statistics dashboard

## Requirements
- Java 17 (JDK)
- Node.js 18+ and npm
- PostgreSQL 13+ (or adjust for your DB)
- Redis (for session/cache)
- PayPal sandbox credentials (for payment testing)
- VietQR/PayOS credentials (for payment)
- Cloudinary credentials (for image uploads)
- SMTP account (for notification emails)

## Backend Setup (cxwud-backend)
1) Configure database and services
- Default profile is `dev` (see `cxwud-backend/src/main/resources/application-dev.yml`).
- Update DB credentials there or create your own profile:
  - Create `application-local.yml`
  - Set `SPRING_PROFILES_ACTIVE=local`

2) Run the backend
```bash
cd cxwud-backend
./mvnw spring-boot:run
```
On Windows:
```bat
cd cxwud-backend
mvnw.cmd spring-boot:run
```

3) Verify
- API base: `http://localhost:8000/api` (dev profile uses port 8000)
- Swagger UI: `http://localhost:8000/swagger-ui.html`
- OpenAPI JSON: `http://localhost:8000/api/docs`

## Frontend Setup (cxwud-frontend)
1) Configure environment
```bash
cd cxwud-frontend
cp .env.example .env
```
Update `VITE_API_BASE_URL` to match your backend base URL.

2) Install and run
```bash
npm install
npm run dev
```

3) Open the app
- `http://localhost:5173`

## Environment Configuration
The backend reads most configuration from `application.yml` and `application-dev.yml`. You can override via environment variables or by creating a custom profile file.

Common settings to review:
- `SPRING_PROFILES_ACTIVE` (default: `dev`)
- `SERVER_PORT` (default: 8000 in dev, 8080 otherwise)
- `SPRING_DATASOURCE_URL`, `SPRING_DATASOURCE_USERNAME`, `SPRING_DATASOURCE_PASSWORD`
- `SPRING_DATA_REDIS_HOST`, `SPRING_DATA_REDIS_PORT`, `SPRING_DATA_REDIS_USERNAME`, `SPRING_DATA_REDIS_PASSWORD`
- `JWT_SECRET_KEY`
- `PAYPAL_BASE_URL`, `PAYPAL_CLIENT_ID`, `PAYPAL_CLIENT_SECRET`, `PAYPAL_CURRENCY`, `PAYPAL_VND_TO_USD_RATE`
- `VIETQR_BASE_URL`, `VIETQR_API_KEY`, `VIETQR_CLIENT_ID`, `VIETQR_CHECKSUM_KEY`
- `CLOUDINARY_CLOUD_NAME`, `CLOUDINARY_API_KEY`, `CLOUDINARY_API_SECRET`
- `MAIL_USERNAME`, `MAIL_PASSWORD`

Frontend:
- `VITE_API_BASE_URL` (example in `.env.example`)

## CORS and Cookies
The backend allows cookie-based auth and has explicit CORS allowlists. If you change the frontend URL or port, update:
- `cxwud-backend/src/main/java/com/ecommerce/aims/config/WebConfig.java`
- `cxwud-backend/src/main/java/com/ecommerce/aims/middleware/security/SecurityConfig.java`

## Database and Migrations
Liquibase changelogs live in:
- `cxwud-backend/src/main/resources/db/changelog`

Seed data:
- `cxwud-backend/src/main/resources/data.sql`

## API Testing
Postman collections:
- `cxwud-backend/src/main/resources/postman_api.json`
- `cxwud-backend/src/test/api/pm-product-management.postman_collection.json`

## Build for Production
Backend:
```bash
cd cxwud-backend
./mvnw clean package
```

Frontend:
```bash
cd cxwud-frontend
npm run build
```

## Notes
- Payments require valid sandbox credentials PayPal
- Payments require valide account PayOS in order to generating VietQR and money transfering in real time.
- Cloudinary is used for product image uploads in the PM dashboard.
- Statistics page currently uses mock data; connect to real endpoints when available.