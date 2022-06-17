-- MySQL dump 10.13  Distrib 5.7.38, for Linux (x86_64)
--
-- Host: rds-pub-eschol-prd.cmcguhglinoa.us-west-2.rds.amazonaws.com    Database: eschol
-- ------------------------------------------------------
-- Server version	5.7.33-log

/*!40101 SET @OLD_CHARACTER_SET_CLIENT=@@CHARACTER_SET_CLIENT */;
/*!40101 SET @OLD_CHARACTER_SET_RESULTS=@@CHARACTER_SET_RESULTS */;
/*!40101 SET @OLD_COLLATION_CONNECTION=@@COLLATION_CONNECTION */;
/*!40101 SET NAMES utf8 */;
/*!40103 SET @OLD_TIME_ZONE=@@TIME_ZONE */;
/*!40103 SET TIME_ZONE='+00:00' */;
/*!40014 SET @OLD_UNIQUE_CHECKS=@@UNIQUE_CHECKS, UNIQUE_CHECKS=0 */;
/*!40014 SET @OLD_FOREIGN_KEY_CHECKS=@@FOREIGN_KEY_CHECKS, FOREIGN_KEY_CHECKS=0 */;
/*!40101 SET @OLD_SQL_MODE=@@SQL_MODE, SQL_MODE='NO_AUTO_VALUE_ON_ZERO' */;
/*!40111 SET @OLD_SQL_NOTES=@@SQL_NOTES, SQL_NOTES=0 */;

--
-- Table structure for table `item_stats`
--

DROP TABLE IF EXISTS `item_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `item_stats` (
  `item_id` char(10) NOT NULL,
  `month` int(11) NOT NULL,
  `attrs` json DEFAULT NULL,
  UNIQUE KEY `item_stats_month_item_id_index` (`month`,`item_id`),
  KEY `item_id` (`item_id`),
  CONSTRAINT `item_stats_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `item_events`
--

DROP TABLE IF EXISTS `item_events`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `item_events` (
  `item_id` char(10) NOT NULL,
  `date` date NOT NULL,
  `time` int(11) DEFAULT NULL,
  `location` int(11) DEFAULT NULL,
  `attrs` json DEFAULT NULL,
  KEY `location` (`location`),
  KEY `item_events_date_item_id_index` (`date`,`item_id`),
  KEY `item_events_item_id_date_index` (`item_id`,`date`),
  CONSTRAINT `item_events_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`),
  CONSTRAINT `item_events_ibfk_2` FOREIGN KEY (`location`) REFERENCES `locations` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `referrers`
--

DROP TABLE IF EXISTS `referrers`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `referrers` (
  `id` int(11) NOT NULL AUTO_INCREMENT,
  `domain` varchar(255) NOT NULL,
  PRIMARY KEY (`id`),
  KEY `referrers_domain_index` (`domain`)
) ENGINE=InnoDB AUTO_INCREMENT=129140 DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `category_stats`
--

DROP TABLE IF EXISTS `category_stats`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `category_stats` (
  `unit_id` varchar(255) NOT NULL,
  `category` varchar(255) NOT NULL,
  `month` int(11) NOT NULL,
  `attrs` json NOT NULL,
  UNIQUE KEY `category_stats_unit_id_category_month_index` (`unit_id`,`category`,`month`),
  CONSTRAINT `category_stats_ibfk_1` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `unit_counts`
--

DROP TABLE IF EXISTS `unit_counts`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `unit_counts` (
  `unit_id` varchar(255) NOT NULL,
  `month` varchar(255) NOT NULL,
  `hits` int(11) DEFAULT NULL,
  `downloads` int(11) DEFAULT NULL,
  `items_posted` int(11) DEFAULT NULL,
  UNIQUE KEY `month` (`month`,`unit_id`),
  KEY `unit_id` (`unit_id`),
  CONSTRAINT `unit_counts_ibfk_1` FOREIGN KEY (`unit_id`) REFERENCES `units` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `archive_meta`
--

DROP TABLE IF EXISTS `archive_meta`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `archive_meta` (
  `item_id` varchar(255) NOT NULL,
  `meta` mediumtext,
  `feed` mediumtext,
  `cookie` mediumtext,
  `history` mediumtext,
  KEY `item_id` (`item_id`),
  CONSTRAINT `archive_meta_ibfk_1` FOREIGN KEY (`item_id`) REFERENCES `items` (`id`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8 ROW_FORMAT=COMPRESSED;
/*!40101 SET character_set_client = @saved_cs_client */;

--
-- Table structure for table `event_logs`
--

DROP TABLE IF EXISTS `event_logs`;
/*!40101 SET @saved_cs_client     = @@character_set_client */;
/*!40101 SET character_set_client = utf8 */;
CREATE TABLE `event_logs` (
  `date` date NOT NULL,
  `digest` varchar(255) NOT NULL,
  PRIMARY KEY (`date`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8;
/*!40101 SET character_set_client = @saved_cs_client */;
/*!40103 SET TIME_ZONE=@OLD_TIME_ZONE */;

/*!40101 SET SQL_MODE=@OLD_SQL_MODE */;
/*!40014 SET FOREIGN_KEY_CHECKS=@OLD_FOREIGN_KEY_CHECKS */;
/*!40014 SET UNIQUE_CHECKS=@OLD_UNIQUE_CHECKS */;
/*!40101 SET CHARACTER_SET_CLIENT=@OLD_CHARACTER_SET_CLIENT */;
/*!40101 SET CHARACTER_SET_RESULTS=@OLD_CHARACTER_SET_RESULTS */;
/*!40101 SET COLLATION_CONNECTION=@OLD_COLLATION_CONNECTION */;
/*!40111 SET SQL_NOTES=@OLD_SQL_NOTES */;

-- Dump completed on 2022-07-19 13:26:18
