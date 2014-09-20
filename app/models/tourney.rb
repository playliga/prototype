class Tourney < ActiveRecord::Base
	validates :name, uniqueness:true, length:{ maximum: 128 }
	validates :in_stage, length:{ maximum: 32 }
	validates :max_slots, :open_slots, presence:true
	validates :max_slots, :open_slots, :season_num, numericality:{ only_integer:true }
	validates :is_roundrobin, :is_autofill, exclusion:{ in: [true, false] }
	validates :game, presence:true
	
	belongs_to :game, inverse_of: :tourneys
	belongs_to :division, inverse_of: :tourneys
	belongs_to :league, inverse_of: :tourneys
end