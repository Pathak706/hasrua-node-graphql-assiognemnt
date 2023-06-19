SET check_function_bodies = false;
COMMENT ON SCHEMA public IS '';
CREATE EXTENSION IF NOT EXISTS pgcrypto WITH SCHEMA public;
COMMENT ON EXTENSION pgcrypto IS 'cryptographic functions';
CREATE TABLE public."user" (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    first_name text NOT NULL,
    last_name text NOT NULL,
    gender text NOT NULL
);
CREATE TABLE public.user_tracking (
    id uuid DEFAULT gen_random_uuid() NOT NULL,
    user_id uuid NOT NULL,
    lat real NOT NULL,
    lng real NOT NULL
);
ALTER TABLE ONLY public."user"
    ADD CONSTRAINT user_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_tracking
    ADD CONSTRAINT user_tracking_pkey PRIMARY KEY (id);
ALTER TABLE ONLY public.user_tracking
    ADD CONSTRAINT user_tracking_user_id_fkey FOREIGN KEY (user_id) REFERENCES public."user"(id) ON UPDATE RESTRICT ON DELETE RESTRICT;
