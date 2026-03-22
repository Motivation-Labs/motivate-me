-- Add 'pending_approval' to rewards status constraint
-- This enables the reward redemption approval flow where monitors
-- must approve before points are deducted.

ALTER TABLE rewards DROP CONSTRAINT IF EXISTS rewards_status_check;
ALTER TABLE rewards ADD CONSTRAINT rewards_status_check
  CHECK (status IN ('available', 'wishlist', 'redeemed', 'pending_approval'));
