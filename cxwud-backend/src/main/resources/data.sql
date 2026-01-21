-- Seed roles
WITH admin_role AS (
    INSERT INTO roles (name) VALUES ('ADMIN')
    ON CONFLICT (name) DO NOTHING
    RETURNING id
),
role_admin AS (
    SELECT id FROM admin_role
    UNION ALL
    SELECT id FROM roles WHERE name = 'ADMIN'
),
pm_role AS (
    INSERT INTO roles (name) VALUES ('PRODUCT_MANAGER')
    ON CONFLICT (name) DO NOTHING
    RETURNING id
),
role_pm AS (
    SELECT id FROM pm_role
    UNION ALL
    SELECT id FROM roles WHERE name = 'PRODUCT_MANAGER'
),
ins_user AS (
    INSERT INTO users (email, password, status)
    VALUES ('test@gmail.com', '$2a$10$7brmBv.rST1XkWb/G8ZobOa3mU0C8.RHuL5FMbEdpCRxIun8kh2zq', 'ACTIVE')
    ON CONFLICT (email) DO NOTHING
    RETURNING id
)
INSERT INTO user_roles (user_id, role_id)
SELECT u.id, r.id
FROM (SELECT id FROM ins_user UNION ALL SELECT id FROM users WHERE email = 'test@gmail.com') u
CROSS JOIN (SELECT id FROM role_admin UNION ALL SELECT id FROM roles WHERE name = 'ADMIN') r
ON CONFLICT DO NOTHING;
