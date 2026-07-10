-- Helper functions for RLS

CREATE OR REPLACE FUNCTION is_admin()
RETURNS boolean AS $$
  SELECT (auth.jwt() -> 'app_metadata' ->> 'role') = 'admin';
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION is_investor()
RETURNS boolean AS $$
  SELECT EXISTS (SELECT 1 FROM deal_profiles WHERE user_id = auth.uid() AND role = 'investor');
$$ LANGUAGE sql SECURITY DEFINER;

CREATE OR REPLACE FUNCTION has_deal_access(minimum_tier text)
RETURNS boolean AS $$
DECLARE
  user_tier text;
BEGIN
  SELECT tier INTO user_tier FROM deal_profiles WHERE user_id = auth.uid();
  RETURN CASE minimum_tier
    WHEN 'evaluation' THEN user_tier IN ('evaluation','diligence','exclusive')
    WHEN 'diligence' THEN user_tier IN ('diligence','exclusive')
    WHEN 'exclusive' THEN user_tier = 'exclusive'
    ELSE false
  END;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;
