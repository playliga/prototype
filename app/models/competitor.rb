class Competitor < ActiveRecord::Base
	validates :name, length:{ maximum: 64 }, presence: true
	validates :group_num, :wins, :loss, :draw, :placement_num, numericality:{ only_integer:true }, allow_blank: true
	
	has_many :matches, through: :competitor_matches
	belongs_to :tourney, inverse_of: :competitors
end