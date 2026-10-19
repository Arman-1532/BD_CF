BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Comments] (
    [id] UNIQUEIDENTIFIER NOT NULL,
    [campaign_id] UNIQUEIDENTIFIER NOT NULL,
    [user_id] UNIQUEIDENTIFIER NOT NULL,
    [content] NVARCHAR(max) NOT NULL,
    [created_at] DATETIME NOT NULL CONSTRAINT [Comments_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Comments_pkey] PRIMARY KEY CLUSTERED ([id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Comments] ADD CONSTRAINT [Comments_campaign_id_fkey] FOREIGN KEY ([campaign_id]) REFERENCES [dbo].[Campaigns]([id]) ON DELETE CASCADE ON UPDATE CASCADE;

-- AddForeignKey
ALTER TABLE [dbo].[Comments] ADD CONSTRAINT [Comments_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[Users]([user_id]) ON DELETE NO ACTION ON UPDATE NO ACTION;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
