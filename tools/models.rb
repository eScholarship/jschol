###################################################################################################
# Monkey-patch to add create_or_update functionality, which is strangely absent in the Sequel gem.
class Sequel::Model
  def self.create_or_update(id, **data)
    record = self[id]
    if record
      record.update(**data)
    else
      data[@primary_key] = id
      self.create(**data)
    end
  end

  def create_or_update
    record = self.class[pk]
    if record
      data = {}
      keys.each { |k| k == self.class.primary_key or data[k] = self[k] }
      record.update(**data)
    else
      save
    end
  end
end

###################################################################################################
# Model classes for easy object-relational mapping in the database.
# We try to keep this list in alpha order, to avoid dupes and make things easy to find.

class Bounce < Sequel::Model
  unrestrict_primary_key
end

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

class ItemContribs < Sequel::Model(:item_contribs)
  unrestrict_primary_key
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

class MassEmail < Sequel::Model
  unrestrict_primary_key
end

class Page < Sequel::Model
end

class Person < Sequel::Model(:people)
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
  one_to_many :unit_hier,     :class=>:UnitHier, :key=>:unit_id
  one_to_many :ancestor_hier, :class=>:UnitHier, :key=>:ancestor_unit
end

class UnitHier < Sequel::Model(:unit_hier)
  unrestrict_primary_key
  many_to_one :unit,          :class=>:Unit
  many_to_one :ancestor,      :class=>:Unit, :key=>:ancestor_unit
end

class UnitItem < Sequel::Model
  unrestrict_primary_key
end

class UnitStat < Sequel::Model
  unrestrict_primary_key
end

class Widget < Sequel::Model
end
