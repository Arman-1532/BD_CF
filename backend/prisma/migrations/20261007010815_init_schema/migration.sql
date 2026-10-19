BEGIN TRY

BEGIN TRAN;

-- CreateTable
CREATE TABLE [dbo].[Users] (
    [user_id] UNIQUEIDENTIFIER NOT NULL,
    [display_name] NVARCHAR(100) NOT NULL,
    [email] VARCHAR(255) NOT NULL,
    [password_hash] VARCHAR(255) NOT NULL,
    [role] VARCHAR(50) NOT NULL CONSTRAINT [Users_role_df] DEFAULT 'standard',
    [status] VARCHAR(30) NOT NULL CONSTRAINT [Users_status_df] DEFAULT 'active',
    [created_at] DATETIME NOT NULL CONSTRAINT [Users_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    [updated_at] DATETIME NOT NULL,
    CONSTRAINT [Users_pkey] PRIMARY KEY CLUSTERED ([user_id]),
    CONSTRAINT [Users_email_key] UNIQUE NONCLUSTERED ([email])
);

-- CreateTable
CREATE TABLE [dbo].[Auth_Tokens] (
    [token_id] INT NOT NULL IDENTITY(1,1),
    [user_id] UNIQUEIDENTIFIER NOT NULL,
    [token_hash] VARCHAR(255) NOT NULL,
    [type] VARCHAR(30) NOT NULL CONSTRAINT [Auth_Tokens_type_df] DEFAULT 'refresh',
    [expires_at] DATETIME NOT NULL,
    [created_at] DATETIME NOT NULL CONSTRAINT [Auth_Tokens_created_at_df] DEFAULT CURRENT_TIMESTAMP,
    CONSTRAINT [Auth_Tokens_pkey] PRIMARY KEY CLUSTERED ([token_id])
);

-- AddForeignKey
ALTER TABLE [dbo].[Auth_Tokens] ADD CONSTRAINT [Auth_Tokens_user_id_fkey] FOREIGN KEY ([user_id]) REFERENCES [dbo].[Users]([user_id]) ON DELETE CASCADE ON UPDATE CASCADE;

COMMIT TRAN;

END TRY
BEGIN CATCH

IF @@TRANCOUNT > 0
BEGIN
    ROLLBACK TRAN;
END;
THROW

END CATCH
