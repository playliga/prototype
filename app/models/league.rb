class League < ActiveRecord::Base
	validates :name, presence: true, uniqueness: true, length: { maximum: 64 }
	validates :current_season, numericality: { only_integer:true }
	has_many :tourneys, inverse_of: :league
end