-- Function to handle low stock notifications
CREATE OR REPLACE FUNCTION handle_low_stock_notification()
RETURNS TRIGGER AS $$
BEGIN
    -- Low Stock Alert
    IF NEW.quantity <= NEW.low_stock_threshold AND (OLD.quantity IS NULL OR OLD.quantity > NEW.low_stock_threshold OR TG_OP = 'INSERT') AND NEW.quantity > 0 THEN
        INSERT INTO notifications (title, message, type)
        VALUES (
            'Low Stock Alert: ' || NEW.name,
            'Product "' || NEW.name || '" has reached ' || NEW.quantity || ' items in stock. Threshold is ' || NEW.low_stock_threshold || '.',
            'LOW_STOCK'
        );
    -- Out of Stock Alert
    ELSIF NEW.quantity = 0 AND (OLD.quantity IS NULL OR OLD.quantity > 0 OR TG_OP = 'INSERT') THEN
        INSERT INTO notifications (title, message, type)
        VALUES (
            'Out of Stock: ' || NEW.name,
            'Product "' || NEW.name || '" is now out of stock!',
            'OUT_OF_STOCK'
        );
    END IF;
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to watch products table
DROP TRIGGER IF EXISTS tr_low_stock_alert ON products;
CREATE TRIGGER tr_low_stock_alert
AFTER INSERT OR UPDATE ON products
FOR EACH ROW EXECUTE PROCEDURE handle_low_stock_notification();
