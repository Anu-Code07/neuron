-- Verify NEURON_API_KEY (Bearer nrn_...) and return linked project
CREATE EXTENSION IF NOT EXISTS pgcrypto;

CREATE OR REPLACE FUNCTION public.verify_api_key(raw_key text)
RETURNS TABLE (project_id uuid, key_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  key_hash text;
BEGIN
  IF raw_key IS NULL OR NOT raw_key LIKE 'nrn_%' THEN
    RETURN;
  END IF;

  key_hash := encode(digest(raw_key, 'sha256'), 'hex');

  RETURN QUERY
  UPDATE public.api_keys ak
  SET last_used_at = now(), updated_at = now()
  FROM (
    SELECT id, project_id
    FROM public.api_keys
    WHERE key_hash = verify_api_key.key_hash
      AND (expires_at IS NULL OR expires_at > now())
    LIMIT 1
  ) match
  WHERE ak.id = match.id
  RETURNING ak.project_id, ak.id;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_api_key(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_api_key(text) TO service_role;
