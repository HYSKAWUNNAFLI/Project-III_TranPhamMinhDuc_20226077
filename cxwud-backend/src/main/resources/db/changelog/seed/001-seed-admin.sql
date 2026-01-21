--liquibase formatted sql

--changeset aims:001-seed-roles context:dev
INSERT INTO roles (name) VALUES ('ADMIN'), ('PRODUCT_MANAGER')
ON CONFLICT (name) DO NOTHING;

--changeset aims:002-seed-admin-user context:dev
INSERT INTO users (email, password, status, created_at, updated_at)
VALUES (
    'admin@aims.com',
    '$2a$12$Bn6v6NtmHKvbi/HtLkjkguGI3wJPQITo6Dj.8YjzufC8.ysWu3SGu',
    'ACTIVE',
    CURRENT_TIMESTAMP,
    CURRENT_TIMESTAMP
)
ON CONFLICT (email) DO NOTHING;

--changeset aims:003-seed-admin-role-assignment context:dev
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM users u, roles r
WHERE u.email = 'admin@aims.com' AND r.name = 'ADMIN'
ON CONFLICT DO NOTHING;
