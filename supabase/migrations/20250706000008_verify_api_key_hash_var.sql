CREATE OR REPLACE FUNCTION public.verify_api_key(raw_key text)
RETURNS TABLE (project_id uuid, key_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  input_hash text;
  matched_id uuid;
  matched_project uuid;
BEGIN
  IF raw_key IS NULL OR NOT raw_key LIKE 'nrn_%' THEN
    RETURN;
  END IF;

  input_hash := encode(digest(convert_to(raw_key, 'UTF8'), 'sha256'), 'hex');

  SELECT ak.id, ak.project_id
  INTO matched_id, matched_project
  FROM public.api_keys ak
  WHERE ak.key_hash = input_hash
    AND (ak.expires_at IS NULL OR ak.expires_at > now())
  LIMIT 1;

  IF matched_id IS NULL THEN
    RETURN;
  END IF;

  UPDATE public.api_keys
  SET last_used_at = now(), updated_at = now()
  WHERE id = matched_id;

  project_id := matched_project;
  key_id := matched_id;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_api_key(text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_api_key(text) TO service_role;
