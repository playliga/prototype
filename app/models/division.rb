class Division < ActiveRecord::Base
	validates :name, presence:true, uniqueness:true, length:{ maximum: 32 }
	has_many :tourneys, inverse_of: :division
end