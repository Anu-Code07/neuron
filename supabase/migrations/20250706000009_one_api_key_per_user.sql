-- One NEURON_API_KEY per user (keep newest if duplicates exist)
DELETE FROM public.api_keys a
USING public.api_keys b
WHERE a.created_by = b.created_by
  AND a.created_at < b.created_at;

CREATE UNIQUE INDEX IF NOT EXISTS api_keys_created_by_unique
  ON public.api_keys (created_by);
