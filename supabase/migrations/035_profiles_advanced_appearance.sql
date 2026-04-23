-- Stage 11.8: Advanced Appearance Mode
-- Adds appearance_mode, custom_accent_color, and extends app_background allowed values.

ALTER TABLE profiles
  ADD COLUMN appearance_mode text NOT NULL DEFAULT 'basic'
    CHECK (appearance_mode IN ('basic', 'advanced')),
  ADD COLUMN custom_accent_color text DEFAULT NULL;

-- Widen the app_background column to accept gradient and noise values.
-- The existing CHECK constraint (if any) is replaced with a new one.
ALTER TABLE profiles
  DROP CONSTRAINT IF EXISTS profiles_app_background_check;

ALTER TABLE profiles
  ADD CONSTRAINT profiles_app_background_check
    CHECK (app_background IN (
      'white', 'aero', 'blobs',
      'gradient-sunset', 'gradient-forest', 'gradient-ocean',
      'gradient-candy', 'gradient-dusk',
      'noise-warm', 'noise-cool'
    ));
