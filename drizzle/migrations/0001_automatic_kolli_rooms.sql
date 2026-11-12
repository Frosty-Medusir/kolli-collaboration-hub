ALTER TABLE public.matches ADD COLUMN room_id uuid NOT NULL DEFAULT gen_random_uuid();
ALTER TABLE public.matches ADD CONSTRAINT matches_room_id_unique UNIQUE (room_id);
COMMENT ON COLUMN public.matches.room_id IS 'Private Kolli room created atomically with each match; access follows match participant policies.';