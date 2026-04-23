ALTER TABLE profiles
  ADD COLUMN ui_preset     text DEFAULT 'classic' CHECK (ui_preset IN ('classic', 'minimal', 'warm')),
  ADD COLUMN theme_mode    text DEFAULT 'system'  CHECK (theme_mode IN ('light', 'dark', 'system')),
  ADD COLUMN text_scale    text DEFAULT 'md'      CHECK (text_scale IN ('sm', 'md', 'lg')),
  ADD COLUMN app_background text DEFAULT 'white'  CHECK (app_background IN ('white', 'aero', 'blobs'));
