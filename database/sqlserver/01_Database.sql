-- =============================================================================
-- LibroSys — SQL Server 2022
-- Archivo: 01_Database.sql
-- Descripción: Creación de la base de datos LibroSys
-- Equivalente MySQL: database/mysql/01_database.sql
-- =============================================================================

IF DB_ID(N'LibroSys') IS NULL
BEGIN
  CREATE DATABASE LibroSys
    COLLATE Latin1_General_100_CI_AS_SC_UTF8;
END
GO

USE LibroSys;
GO

SET ANSI_NULLS ON;
SET QUOTED_IDENTIFIER ON;
GO

-- Aislamiento y opciones recomendadas
ALTER DATABASE LibroSys SET ALLOW_SNAPSHOT_ISOLATION ON;
ALTER DATABASE LibroSys SET READ_COMMITTED_SNAPSHOT ON;
GO

PRINT N'01_Database.sql :: Base de datos LibroSys lista.';
GO
