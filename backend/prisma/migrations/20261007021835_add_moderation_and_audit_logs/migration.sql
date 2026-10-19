BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Campaigns] ADD [takedown_reason] NVARCHAR(max),
[taken_down_at] DATETIME;

-- AlterTable
ALTER TABLE [dbo].[Users] ADD [blacklist_reason] NVARCHAR(max),
[blacklisted_at] DATETIME,
[is_blacklisted] BIT NOT NULL CONSTRAINT [Users_is_blacklisted_df] DEFAULT 0;

-- CreateTable
CREATE TABLE [dbo].[Admin_Audit_Logs] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [admin_id] UNIQUEIDENTIFIER NOT NULL,
    [action] VARCHAR(100) NOT NULL,
    [target_id] UNIQUEIDENTIFIER NOT NULL,
    [reason] NVARCHAR(max) NOT NULL,
    [created_at] DATETIME NOT NULL CONSTRAINT [Admin_Audit_Logs_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Admin_Audit_Logs_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Admin_Audit_Logs] ADD CONSTRAINT [Admin_Audit_Logs_admin_id_fkey] FOREIGN KEY ([admin_id]) REFERENCES [dbo].[Users]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
