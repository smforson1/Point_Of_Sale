-- Add PAYSTACK to the payment_method enum type
-- Run this in your Supabase SQL Editor if you see an error about "invalid input value for enum payment_method"

ALTER TYPE payment_method ADD VALUE 'PAYSTACK' IF NOT EXISTS;
