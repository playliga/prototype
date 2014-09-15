class Tourney < ActiveRecord::Base
	validates :name, length:{ maximum: 128 }
	belongs_to :game
end