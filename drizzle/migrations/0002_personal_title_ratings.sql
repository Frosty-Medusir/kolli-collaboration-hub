CREATE TABLE public.title_ratings (
 user_id uuid NOT NULL REFERENCES public.profiles(id) ON DELETE CASCADE,
 content_id integer NOT NULL CHECK (content_id > 0),
 content_type text NOT NULL CHECK (content_type IN ('movie','tv')),
 content_title text NOT NULL,
 stars integer NOT NULL CHECK (stars BETWEEN 1 AND 5),
 genre_ids integer[] NOT NULL DEFAULT '{}',
 updated_at timestamptz NOT NULL DEFAULT now(),
 PRIMARY KEY(user_id, content_id, content_type)
);
GRANT SELECT, INSERT, UPDATE, DELETE ON public.title_ratings TO authenticated;
GRANT ALL ON public.title_ratings TO service_role;
ALTER TABLE public.title_ratings ENABLE ROW LEVEL SECURITY;
CREATE POLICY "Own title ratings" ON public.title_ratings FOR ALL TO authenticated USING (user_id = auth.uid()) WITH CHECK (user_id = auth.uid());