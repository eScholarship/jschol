###################################################################################################
# Monkey-patch to add update_or_replace functionality, which is strangely absent in the Sequel gem.
class Sequel::Model
  def self.create_or_update(id, **data)
    record = self[id]
    if record
      record.update(**data)
    else
      data[@primary_key] = id
      Unit.create(**data)
    end
  end
end

###################################################################################################
# Model classes for easy object-relational mapping in the database.
# We try to keep this list in alpha order, to avoid dupes and make things easy to find.

class DisplayPDF < Sequel::Model
  unrestrict_primary_key
end

class CategoryStat < Sequel::Model
  unrestrict_primary_key
end

class EventLog < Sequel::Model
  unrestrict_primary_key
end

class InfoIndex < Sequel::Model(:info_index)
end

class Item < Sequel::Model
  unrestrict_primary_key
end

class ItemAuthor < Sequel::Model
  unrestrict_primary_key
end

class ItemAuthors < Sequel::Model(:item_authors)
  unrestrict_primary_key
end

class ItemCount < Sequel::Model
end

class ItemEvent < Sequel::Model
  unrestrict_primary_key
end

class ItemStat < Sequel::Model
  unrestrict_primary_key
end

class Issue < Sequel::Model
end

class Location < Sequel::Model
end

class Page < Sequel::Model
end

class Person < Sequel::Model(:people)
  unrestrict_primary_key
end

class PersonStat < Sequel::Model
  unrestrict_primary_key
end

class Redirect < Sequel::Model
end

class Referrer < Sequel::Model
end

class Section < Sequel::Model
end

class StatsMonth < Sequel::Model
  unrestrict_primary_key
end

class Unit < Sequel::Model
  unrestrict_primary_key
end

class UnitCount < Sequel::Model
end

class UnitHier < Sequel::Model(:unit_hier)
  unrestrict_primary_key
end

class UnitItem < Sequel::Model
  unrestrict_primary_key
end

class UnitStat < Sequel::Model
  unrestrict_primary_key
end

class Widget < Sequel::Model
end
