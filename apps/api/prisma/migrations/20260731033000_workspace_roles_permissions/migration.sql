-- CreateTable
CREATE TABLE "WorkspaceRole" (
    "id" TEXT NOT NULL,
    "workspaceId" TEXT NOT NULL,
    "name" TEXT NOT NULL,
    "key" TEXT NOT NULL,
    "isSystem" BOOLEAN NOT NULL DEFAULT false,
    "permissions" TEXT[],
    "createdAt" TIMESTAMP(3) NOT NULL DEFAULT CURRENT_TIMESTAMP,
    "updatedAt" TIMESTAMP(3) NOT NULL,

    CONSTRAINT "WorkspaceRole_pkey" PRIMARY KEY ("id")
);

-- CreateIndex
CREATE INDEX "WorkspaceRole_workspaceId_idx" ON "WorkspaceRole"("workspaceId");

-- CreateIndex
CREATE UNIQUE INDEX "WorkspaceRole_workspaceId_key_key" ON "WorkspaceRole"("workspaceId", "key");

-- AddForeignKey
ALTER TABLE "WorkspaceRole" ADD CONSTRAINT "WorkspaceRole_workspaceId_fkey" FOREIGN KEY ("workspaceId") REFERENCES "Workspace"("id") ON DELETE CASCADE ON UPDATE CASCADE;

-- Add nullable roleId columns
ALTER TABLE "WorkspaceMember" ADD COLUMN "roleId" TEXT;
ALTER TABLE "WorkspaceInvite" ADD COLUMN "roleId" TEXT;

-- Seed system roles and backfill members/invites from legacy Role enum
DO $$
DECLARE
  ws RECORD;
  pm_id TEXT;
  am_id TEXT;
  contrib_id TEXT;
  developer_id TEXT;
  designer_id TEXT;
BEGIN
  FOR ws IN SELECT id FROM "Workspace" LOOP
    pm_id := gen_random_uuid()::text;
    am_id := gen_random_uuid()::text;
    developer_id := gen_random_uuid()::text;
    designer_id := gen_random_uuid()::text;
    contrib_id := gen_random_uuid()::text;

    -- Use cuid-like ids via replace of uuid dashes for compatibility
    pm_id := replace(pm_id, '-', '');
    am_id := replace(am_id, '-', '');
    developer_id := replace(developer_id, '-', '');
    designer_id := replace(designer_id, '-', '');
    contrib_id := replace(contrib_id, '-', '');

    INSERT INTO "WorkspaceRole" ("id", "workspaceId", "name", "key", "isSystem", "permissions", "createdAt", "updatedAt")
    VALUES
      (
        pm_id, ws.id, 'Project Manager', 'project_manager', true,
        ARRAY[
          'workspace.manage','roles.manage','members.invite','members.manage',
          'projects.create','projects.manage','tasks.create','tasks.edit_any','tasks.delete',
          'custom_fields.manage','automations.manage','intake_forms.manage'
        ],
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ),
      (
        am_id, ws.id, 'Assistant Manager', 'assistant_manager', true,
        ARRAY[
          'members.invite','members.manage',
          'projects.create','projects.manage','tasks.create','tasks.edit_any','tasks.delete',
          'custom_fields.manage','automations.manage','intake_forms.manage'
        ],
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ),
      (
        developer_id, ws.id, 'Developer', 'developer', true,
        ARRAY[]::TEXT[],
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ),
      (
        designer_id, ws.id, 'Designer', 'designer', true,
        ARRAY[]::TEXT[],
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      ),
      (
        contrib_id, ws.id, 'Contributor', 'contributor', true,
        ARRAY[]::TEXT[],
        CURRENT_TIMESTAMP, CURRENT_TIMESTAMP
      );

    UPDATE "WorkspaceMember"
    SET "roleId" = CASE "role"::text
      WHEN 'OWNER' THEN pm_id
      WHEN 'ADMIN' THEN am_id
      ELSE contrib_id
    END
    WHERE "workspaceId" = ws.id;

    UPDATE "WorkspaceInvite"
    SET "roleId" = CASE "role"::text
      WHEN 'OWNER' THEN pm_id
      WHEN 'ADMIN' THEN am_id
      ELSE contrib_id
    END
    WHERE "workspaceId" = ws.id;
  END LOOP;
END $$;

-- Failsafe for any nulls
UPDATE "WorkspaceMember" m
SET "roleId" = r.id
FROM "WorkspaceRole" r
WHERE m."roleId" IS NULL
  AND r."workspaceId" = m."workspaceId"
  AND r."key" = 'contributor';

UPDATE "WorkspaceInvite" i
SET "roleId" = r.id
FROM "WorkspaceRole" r
WHERE i."roleId" IS NULL
  AND r."workspaceId" = i."workspaceId"
  AND r."key" = 'contributor';

-- Make roleId required
ALTER TABLE "WorkspaceMember" ALTER COLUMN "roleId" SET NOT NULL;
ALTER TABLE "WorkspaceInvite" ALTER COLUMN "roleId" SET NOT NULL;

-- Drop legacy role columns
ALTER TABLE "WorkspaceMember" DROP COLUMN "role";
ALTER TABLE "WorkspaceInvite" DROP COLUMN "role";

-- Drop enum
DROP TYPE "Role";

-- Indexes + FKs for roleId
CREATE INDEX "WorkspaceMember_roleId_idx" ON "WorkspaceMember"("roleId");
CREATE INDEX "WorkspaceInvite_roleId_idx" ON "WorkspaceInvite"("roleId");

ALTER TABLE "WorkspaceMember" ADD CONSTRAINT "WorkspaceMember_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "WorkspaceRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
ALTER TABLE "WorkspaceInvite" ADD CONSTRAINT "WorkspaceInvite_roleId_fkey" FOREIGN KEY ("roleId") REFERENCES "WorkspaceRole"("id") ON DELETE RESTRICT ON UPDATE CASCADE;
