class Tourney < ActiveRecord::Base
	STAGE_BUILDING = 'Building'
	STAGE_READY = 'Ready'
	STAGE_WAITING = 'Waiting'
	STAGE_COMPLETED = 'Completed'
	
	validates :name, uniqueness:true, length:{ maximum: 128 }, allow_blank: true
	validates :in_stage, length:{ maximum: 32 }
	validates :max_slots, :open_slots, presence:true
	validates :max_slots, :open_slots, :season_num, numericality:{ only_integer:true }
	validates :game, presence:true
	
	has_many :competitors, inverse_of: :tourney
	
	belongs_to :game, inverse_of: :tourneys
	belongs_to :division, inverse_of: :tourneys
	belongs_to :league, inverse_of: :tourneys
end