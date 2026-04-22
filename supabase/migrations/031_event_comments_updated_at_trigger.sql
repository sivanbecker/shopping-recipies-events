-- Auto-bump updated_at on UPDATE so the UI can show an "(edited)" marker reliably.

CREATE OR REPLACE FUNCTION touch_event_comments_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER event_comments_touch_updated_at
  BEFORE UPDATE ON event_comments
  FOR EACH ROW
  EXECUTE FUNCTION touch_event_comments_updated_at();
