class CompetitorMatch < ActiveRecord::Base
	validates :score, numericality:{ only_integer:true }, allow_blank: true
	
	belongs_to :match
	belongs_to :competitor
end