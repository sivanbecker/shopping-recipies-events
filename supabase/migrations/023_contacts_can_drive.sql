-- Stage 6.2 fix — contacts: mark who can help with transportation
ALTER TABLE contacts ADD COLUMN can_drive boolean NOT NULL DEFAULT false;
