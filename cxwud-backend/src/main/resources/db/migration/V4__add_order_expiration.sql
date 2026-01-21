-- Add expiration timestamps to orders and payment transactions
ALTER TABLE orders ADD COLUMN expires_at TIMESTAMP;
ALTER TABLE payment_transactions ADD COLUMN expires_at TIMESTAMP;

-- Create index for efficient expiration queries
CREATE INDEX idx_orders_expires_at ON orders(expires_at) WHERE expires_at IS NOT NULL AND status = 'PENDING_PROCESSING';
CREATE INDEX idx_payment_transactions_expires_at ON payment_transactions(expires_at) WHERE expires_at IS NOT NULL AND status = 'PENDING';

-- Function to auto-expire pending orders (optional - can also use Spring Scheduler)
CREATE OR REPLACE FUNCTION expire_pending_orders()
RETURNS void AS $$
BEGIN
    -- Auto-cancel orders that have expired
    UPDATE orders
    SET status = 'CANCELLED',
        updated_at = NOW()
    WHERE status = 'PENDING_PROCESSING'
      AND expires_at IS NOT NULL
      AND expires_at < NOW();
      
    -- Mark payment transactions as failed
    UPDATE payment_transactions pt
    SET status = 'FAILED',
        updated_at = NOW()
    FROM orders o
    WHERE pt.order_id = o.id
      AND o.status = 'CANCELLED'
      AND pt.status = 'PENDING'
      AND o.expires_at IS NOT NULL
      AND o.expires_at < NOW();
END;
$$ LANGUAGE plpgsql;

-- Optional: Schedule to run every minute using pg_cron extension
-- (requires pg_cron extension to be installed)
-- SELECT cron.schedule('expire-orders', '* * * * *', 'SELECT expire_pending_orders()');
