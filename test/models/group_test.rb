require 'test_helper'

class GroupTest < ActiveSupport::TestCase
	test '1' do
		grp_obj = Group.new
		grp_obj.group_num = 3
		assert !grp_obj.save, 'group must belong to a tourney.'
	end
	test '2' do
		grp_obj = Group.new
		grp_obj.tourney = Tourney.find(1)
		assert !grp_obj.save, 'group must have a group number.'
	end
	test '3' do
		grp_obj = Group.new
		grp_obj.tourney = Tourney.find(1)
		grp_obj.group_num = 'String'
		assert !grp_obj.save, 'group num must be an integer.'
	end
end