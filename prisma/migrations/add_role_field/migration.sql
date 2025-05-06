-- Add role field to User table
ALTER TABLE "User" ADD COLUMN "role" TEXT NOT NULL DEFAULT 'student'; 