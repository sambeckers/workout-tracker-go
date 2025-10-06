# Security Overview

This document records the hardening work applied to protect user profile data.

## Profiles Table Hardening (2025-10-06)

### Previous State
The `public.profiles` table originally had an overly permissive policy:

```sql
CREATE POLICY "Public profiles are viewable by everyone" ON public.profiles
  FOR SELECT USING (true);
```

This allowed any client (including anonymous / unauthenticated) to select **all** profile rows (username, full_name, avatar_url, bio). Although Row Level Security (RLS) was enabled, this permissive SELECT effectively exposed personal data by design.

### Risks
- Enumeration of all users (usernames, names, avatars) by unauthenticated parties.
- Future addition of more fields (location, social handles, etc.) would silently inherit exposure.
- Hard to retroactively revoke data already scraped by third parties.

### Remediation
A new migration (`20251006120000_harden_profiles_rls.sql`) was added which:
1. Drops all existing policies on `public.profiles`.
2. Replaces them with strict, per-user policies:

```sql
CREATE POLICY "profiles_select_own" ON public.profiles
  FOR SELECT USING (auth.uid() = id);

CREATE POLICY "profiles_insert_own" ON public.profiles
  FOR INSERT WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_update_own" ON public.profiles
  FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE POLICY "profiles_delete_own" ON public.profiles
  FOR DELETE USING (auth.uid() = id);
```

### Result
- No public access to any profile data.
- Each authenticated user can only read/update/delete their own row.
- Attempts to insert or manipulate another id are rejected.

### Optional Public Directory Pattern
If later you want a *public* view of limited profile info (e.g. username + avatar), prefer a **view** rather than broadening policies:

```sql
CREATE VIEW public.public_profiles AS
SELECT id, username, avatar_url
FROM public.profiles
WHERE username IS NOT NULL;

CREATE POLICY public_profiles_select_all ON public.public_profiles
  FOR SELECT USING (true);
```

This keeps sensitive fields (full_name, bio, future additions) private.

### Manual Verification
Run these from the SQL editor while authenticated as a normal user:

```sql
-- 1. Should return exactly your own row
SELECT * FROM public.profiles;

-- 2. Should affect 0 rows (cannot update others)
UPDATE public.profiles SET full_name = 'X' WHERE id <> auth.uid();

-- 3. Should fail or 0 rows (cannot delete others)
DELETE FROM public.profiles WHERE id <> auth.uid();

-- 4. Attempt to insert arbitrary id (should fail)
INSERT INTO public.profiles (id, full_name) VALUES ('00000000-0000-0000-0000-000000000000', 'Hacker');
```

### Client-Side Impact
No code changes needed unless the frontend relied on listing other users' profiles. If that emerges as a requirement, implement the **view** approach above instead of loosening base table policies.

### Next Recommendations
- Periodically audit `pg_policies` for unexpected permissive rules:
  ```sql
  SELECT * FROM pg_policies WHERE schemaname='public';
  ```
- Add automated migration review to CI to flag `USING (true)` on tables with PII.
- Consider field-level hashing/redaction for especially sensitive metadata.

---
_Last updated: 2025-10-06_
