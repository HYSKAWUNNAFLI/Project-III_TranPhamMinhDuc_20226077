-- Add is_checked_out column to carts table to prevent duplicate orders
ALTER TABLE carts ADD COLUMN is_checked_out BOOLEAN NOT NULL DEFAULT FALSE;

-- Create index for faster queries on checkout status
CREATE INDEX idx_carts_is_checked_out ON carts(is_checked_out);
