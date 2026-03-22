-- Video visit + SOAP fields on Appointment (used by apps/video, knowledge-base)

ALTER TABLE "Appointment" ADD COLUMN "videoSessionId" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "callStartedAt" TIMESTAMP(3);
ALTER TABLE "Appointment" ADD COLUMN "callEndedAt" TIMESTAMP(3);
ALTER TABLE "Appointment" ADD COLUMN "postCallNotes" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "soapSummary" TEXT;
ALTER TABLE "Appointment" ADD COLUMN "soapStructured" JSONB;
