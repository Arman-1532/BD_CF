BEGIN TRY

BEGIN TRAN;

-- AlterTable
ALTER TABLE [dbo].[Users] DROP CONSTRAINT [Users_role_df];
ALTER TABLE [dbo].[Users] ADD CONSTRAINT [Users_role_df] DEFAULT 'STANDARD' FOR [role];

-- CreateTable
CREATE TABLE [dbo].[Campaigns] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [title] NVARCHAR(200) NOT NULL,
    [description] NVARCHAR(max) NOT NULL,
    [category] VARCHAR(100) NOT NULL,
    [target_amount] FLOAT(53) NOT NULL,
    [current_amount] FLOAT(53) NOT NULL CONSTRAINT [Campaigns_current_amount_df] DEFAULT 0,
    [image_data] NVARCHAR(max) NOT NULL,
    [image_type] VARCHAR(50) NOT NULL,
    [status] VARCHAR(30) NOT NULL CONSTRAINT [Campaigns_status_df] DEFAULT 'PENDING',
    [created_by_id] UNIQUEIDENTIFIER NOT NULL,
    [created_at] DATETIME NOT NULL CONSTRAINT [Campaigns_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME NOT NULL,
    CONSTRAINT [Campaigns_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Campaigns] ADD CONSTRAINT [Campaigns_created_by_id_fkey] FOREIGN KEY ([created_by_id]) REFERENCES [dbo].[Users]([user_id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
