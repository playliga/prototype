class Group < ActiveRecord::Base
	validates :group_num, presence:true, numericality:{ only_integer:true }
	validates :tourney, presence:true
	
	belongs_to :tourney, inverse_of: :groups
end