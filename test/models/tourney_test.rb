require 'test_helper'

class TourneyTest < ActiveSupport::TestCase
	test 'name cannot be longer than 128 chars' do
		t_obj = Tourney.new
		t_obj.name = 'abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz1234567890'
		t_obj.open_slots = 32
		t_obj.max_slots = 32
		t_obj.game = Game.find(1)
		assert !t_obj.save
	end
	test 'in_stage cannot be longer than 32 chars' do
		t_obj = Tourney.new
		t_obj.in_stage = 'abcdefghijklmnopqrstuvwxyz1234567890'
		t_obj.open_slots = 32
		t_obj.max_slots = 32
		t_obj.game = Game.find(1)
		assert !t_obj.save
	end
	test 'max_slots cannot be empty' do
		t_obj = Tourney.new
		t_obj.open_slots = 16
		t_obj.game = Game.find(1)
		assert !t_obj.save
	end
	test 'open_slots cannot be empty' do
		t_obj = Tourney.new
		t_obj.open_slots = 32
		t_obj.max_slots = 32
		t_obj.game = Game.find(1)
		assert !t_obj.save
	end
	test 'max_slots must be an integer' do
		t_obj = Tourney.new
		t_obj.open_slots = 32
		t_obj.max_slots = 'A String'
		t_obj.game = Game.find(1)
		assert !t_obj.save
	end
	test 'open_slots must be an integer' do
		t_obj = Tourney.new
		t_obj.open_slots = 'A String'
		t_obj.max_slots = 32
		t_obj.game = Game.find(1)
		assert !t_obj.save
	end
	test 'season_num must be an integer' do
		t_obj = Tourney.new
		t_obj.open_slots = 32
		t_obj.max_slots = 32
		t_obj.season_num = 'A String'
		t_obj.game = Game.find(1)
		assert !t_obj.save
	end
	test 'is_autofill must be a boolean' do
		t_obj = Tourney.new
		t_obj.open_slots = 32
		t_obj.max_slots = 32
		t_obj.is_autofill = 'A String'
		t_obj.game = Game.find(1)
		assert !t_obj.save
	end
	test 'is_roundrobin must be a boolean' do
		t_obj = Tourney.new
		t_obj.open_slots = 32
		t_obj.max_slots = 32
		t_obj.is_roundrobin = 'A String'
		t_obj.game = Game.find(1)
		assert !t_obj.save
	end
	test 'game association must be set' do
		# do work.
	end
	test 'get the division name tourney is in' do
		# do work.
	end
	test 'get the league name tourney is in' do
		# do work.
	end
	test 'get the competitor names for this tourney' do
		# do work.
	end
	test 'get the group names for this tourney' do
		# do work.
	end
end