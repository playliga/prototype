class CompetitorMatch < ActiveRecord::Base
	belongs_to :match
	belongs_to :competitor
end