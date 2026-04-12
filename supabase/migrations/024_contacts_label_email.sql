-- Stage 6.7 — contacts: add relationship label and email for account linking
ALTER TABLE contacts
  ADD COLUMN label text CHECK (label IN ('family', 'friend')),
  ADD COLUMN email text;
