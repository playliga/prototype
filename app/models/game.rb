class Game < ActiveRecord::Base
	validates :name, presence:true, uniqueness:true, length:{ maximum: 64 }
	validates :short_name, presence:true, uniqueness:true, length:{ maximum: 8 }
	
	has_many :tourneys, inverse_of: :game
	has_many :leagues, inverse_of: :game
end