USE `dg250129418_db`;

CREATE TABLE
    `accounts` (
        `id` bigint (20) UNSIGNED AUTO_INCREMENT,
        `name` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
        `email` varchar(100) COLLATE utf8mb4_unicode_ci UNIQUE KEY NOT NULL,
        `aboutme` varchar(500) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        `education` varchar(100) COLLATE utf8mb4_unicode_ci DEFAULT NULL,
        `password` varchar(255) COLLATE utf8mb4_unicode_ci NOT NULL,
        PRIMARY KEY (id)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE utf8mb4_general_ci;

CREATE TABLE
    `codelangs` (
        `id` bigint (20) UNSIGNED AUTO_INCREMENT,
        `account_id` bigint (20) UNSIGNED,
        `lang` varchar(50) COLLATE utf8mb4_unicode_ci NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY (account_id) REFERENCES accounts (id)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE utf8mb4_general_ci;

CREATE TABLE
    `links` (
        `id` bigint (20) UNSIGNED AUTO_INCREMENT,
        `account_id` bigint (20) UNSIGNED,
        `link` varchar(100) COLLATE utf8mb4_unicode_ci NOT NULL,
        `type` ENUM ('linkedin', 'x', 'instagram', 'youtube') NOT NULL,
        PRIMARY KEY (id),
        FOREIGN KEY (account_id) REFERENCES accounts (id)
    ) ENGINE = InnoDB DEFAULT CHARSET = utf8mb4 COLLATE utf8mb4_general_ci;