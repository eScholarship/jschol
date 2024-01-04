-- Update all tables with foreign key relations with unit id to cascade update to unable unit id changes

ALTER TABLE category_stats DROP FOREIGN KEY category_stats_ibfk_1;
ALTER TABLE category_stats ADD FOREIGN KEY (unit_id) REFERENCES units(id) ON UPDATE CASCADE;
ALTER TABLE issues DROP FOREIGN KEY issues_ibfk_1;
ALTER TABLE issues ADD FOREIGN KEY (unit_id) REFERENCES units(id) ON UPDATE CASCADE;
ALTER TABLE pages DROP FOREIGN KEY pages_ibfk_1;
ALTER TABLE pages ADD FOREIGN KEY (unit_id) REFERENCES units(id) ON UPDATE CASCADE;
ALTER TABLE unit_counts DROP FOREIGN KEY unit_counts_ibfk_1;
ALTER TABLE unit_counts ADD FOREIGN KEY (unit_id) REFERENCES units(id) ON UPDATE CASCADE;
ALTER TABLE unit_hier DROP FOREIGN KEY unit_hier_ibfk_1;
ALTER TABLE unit_hier ADD FOREIGN KEY (unit_id) REFERENCES units(id) ON UPDATE CASCADE;
ALTER TABLE unit_hier DROP FOREIGN KEY unit_hier_ibfk_2;
ALTER TABLE unit_hier ADD FOREIGN KEY (ancestor_unit) REFERENCES units(id) ON UPDATE CASCADE;
ALTER TABLE unit_items DROP FOREIGN KEY unit_items_ibfk_1;
ALTER TABLE unit_items ADD FOREIGN KEY (unit_id) REFERENCES units(id) ON UPDATE CASCADE;
ALTER TABLE unit_stats DROP FOREIGN KEY unit_stats_ibfk_1;
ALTER TABLE unit_stats ADD FOREIGN KEY (unit_id) REFERENCES units(id) ON UPDATE CASCADE;
ALTER TABLE widgets DROP FOREIGN KEY widgets_ibfk_1;
ALTER TABLE widgets ADD FOREIGN KEY (unit_id) REFERENCES units(id) ON UPDATE CASCADE;
