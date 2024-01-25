SET SQL_MODE = "NO_AUTO_VALUE_ON_ZERO";
START TRANSACTION;
SET time_zone = "+00:00";

CREATE TABLE `payment` (
  `id` int(11) NOT NULL,
  `frequency` enum('one-time','monthly','annually') NOT NULL,
  `currency` enum('CHF','USD','EUR','') NOT NULL,
  `amount` float NOT NULL,
  `email` varchar(320) NOT NULL,
  `givenNames` text NOT NULL,
  `familyName` text NOT NULL,
  `organization` text NOT NULL,
  `comment` text NOT NULL,
  `display` tinyint(1) NOT NULL,
  `displayGivenNames` tinyint(1) NOT NULL,
  `hideAmount` tinyint(1) NOT NULL,
  `date` datetime NOT NULL DEFAULT current_timestamp(),
  `country` varchar(3) NOT NULL,
  `paid` datetime NOT NULL,
  `test` tinyint(1) NOT NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;


ALTER TABLE `payment`
  ADD PRIMARY KEY (`id`);


ALTER TABLE `payment`
  MODIFY `id` int(11) NOT NULL AUTO_INCREMENT;
COMMIT;
