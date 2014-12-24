class Competitor < ActiveRecord::Base
	validates :name, length:{ maximum: 64 }, presence: true
	validates :group_num, :wins, :loss, :draw, :placement_num, numericality:{ only_integer:true }, allow_blank: true
	
	# define many_to_many with matches
	belongs_to :tourney, inverse_of: :competitors
end