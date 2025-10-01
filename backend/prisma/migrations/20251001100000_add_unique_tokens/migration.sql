-- Add unique indexes for sys_tokens to align history with existing DB state
-- Safe-guarded with IF NOT EXISTS for idempotency if applied elsewhere

CREATE UNIQUE INDEX IF NOT EXISTS "sys_tokens_access_token_key" ON "sys_tokens"("access_token");
CREATE UNIQUE INDEX IF NOT EXISTS "sys_tokens_refresh_token_key" ON "sys_tokens"("refresh_token");


