CREATE TABLE "public"."user_tracking" ("id" uuid NOT NULL DEFAULT gen_random_uuid(), "lat" text NOT NULL, "lng" text NOT NULL, "user_id" uuid NOT NULL, "created_at" timestamptz NOT NULL DEFAULT now(), "updated_at" timestamptz NOT NULL DEFAULT now(), PRIMARY KEY ("id") , FOREIGN KEY ("user_id") REFERENCES "public"."user"("id") ON UPDATE restrict ON DELETE cascade);COMMENT ON TABLE "public"."user_tracking" IS E'user location lat and lng info';
CREATE OR REPLACE FUNCTION "public"."set_current_timestamp_updated_at"()
RETURNS TRIGGER AS $$
DECLARE
  _new record;
BEGIN
  _new := NEW;
  _new."updated_at" = NOW();
  RETURN _new;
END;
$$ LANGUAGE plpgsql;
CREATE TRIGGER "set_public_user_tracking_updated_at"
BEFORE UPDATE ON "public"."user_tracking"
FOR EACH ROW
EXECUTE PROCEDURE "public"."set_current_timestamp_updated_at"();
COMMENT ON TRIGGER "set_public_user_tracking_updated_at" ON "public"."user_tracking"
IS 'trigger to set value of column "updated_at" to current timestamp on row update';
CREATE EXTENSION IF NOT EXISTS pgcrypto;
