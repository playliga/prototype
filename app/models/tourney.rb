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
		# save group num. (save competitor)
		# update matches table.
		# update competitor_matches with both competitors involved in match.
		tourney_obj = Tourney.find(comps_arr[0].tourney.id)
		group_num = comps_arr[0].group_num
		current = 0
		while current < comps_arr.length
			opponent = current + 1
			while opponent < comps_arr.length
				match_obj = Match.new
				match_obj.tourney = tourney_obj
				match_obj.group_num = group_num
				match_obj.competitors = [comps_arr[current], comps_arr[opponent]]
				match_obj.save
				opponent += 1
			end
			current += 1
		end
	end
end