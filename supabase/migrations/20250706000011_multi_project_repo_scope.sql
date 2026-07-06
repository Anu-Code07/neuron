-- Multi-project: one API key per user per project (not one key globally)
DROP INDEX IF EXISTS public.api_keys_created_by_unique;

CREATE UNIQUE INDEX IF NOT EXISTS api_keys_created_by_project_unique
  ON public.api_keys (created_by, project_id);

-- Return key owner for project override checks from MCP
DROP FUNCTION IF EXISTS public.verify_api_key(text);
DROP FUNCTION IF EXISTS public.verify_api_key(text, text);

CREATE OR REPLACE FUNCTION public.verify_api_key(raw_key text, client_name text DEFAULT NULL)
RETURNS TABLE (project_id uuid, key_id uuid, user_id uuid)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public, extensions
AS $$
DECLARE
  input_hash text;
  matched_id uuid;
  matched_project uuid;
  matched_user uuid;
  normalized_client text;
BEGIN
  IF raw_key IS NULL OR NOT raw_key LIKE 'nrn_%' THEN
    RETURN;
  END IF;

  input_hash := encode(digest(convert_to(raw_key, 'UTF8'), 'sha256'), 'hex');

  SELECT ak.id, ak.project_id, ak.created_by
  INTO matched_id, matched_project, matched_user
  FROM public.api_keys ak
  WHERE ak.key_hash = input_hash
    AND (ak.expires_at IS NULL OR ak.expires_at > now())
  LIMIT 1;

  IF matched_id IS NULL THEN
    RETURN;
  END IF;

  normalized_client := NULL;
  IF client_name IS NOT NULL AND btrim(client_name) <> '' THEN
    normalized_client := lower(btrim(client_name));
    IF normalized_client NOT IN ('cursor', 'claude', 'antigravity', 'vscode', 'windsurf', 'other') THEN
      normalized_client := 'other';
    END IF;
  END IF;

  UPDATE public.api_keys
  SET
    last_used_at = now(),
    updated_at = now(),
    mcp_clients = CASE
      WHEN normalized_client IS NULL THEN mcp_clients
      ELSE COALESCE(mcp_clients, '{}'::jsonb) || jsonb_build_object(normalized_client, to_jsonb(now()))
    END
  WHERE id = matched_id;

  project_id := matched_project;
  key_id := matched_id;
  user_id := matched_user;
  RETURN NEXT;
END;
$$;

REVOKE ALL ON FUNCTION public.verify_api_key(text, text) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION public.verify_api_key(text, text) TO service_role;
