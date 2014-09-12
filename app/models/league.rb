class League < ActiveRecord::Base
	validates :name, presence: true, length: { maximum: 64 }, numericality: { only_integer: true }
	has_many :tourneys, inverse_of: :league
end