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
	has_many :matches, inverse_of: :tourney
	
	belongs_to :game, inverse_of: :tourneys
	belongs_to :division, inverse_of: :tourneys
	belongs_to :league, inverse_of: :tourneys
	
	def self.gen_matches(comps_arr, times_to_play = 1)
		matches_arr = Array.new
		current = 0
		num_times_played = 0
		
		while current < comps_arr.length
			opponent = current + 1
			while opponent < comps_arr.length
				matches_arr.push(Array.new([comps_arr[current].name, comps_arr[opponent].name]))
				opponent += 1
			end
			
			num_times_played += 1
			if num_times_played >= times_to_play
				current += 1
				num_times_played = 0
			end
		end
		
		matches_arr
	end
end