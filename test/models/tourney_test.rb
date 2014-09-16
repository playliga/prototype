require 'test_helper'

class TourneyTest < ActiveSupport::TestCase
	test '1' do
		t_obj = Tourney.new
		t_obj.name = 'abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz1234567890'
		t_obj.open_slots = 32
		t_obj.max_slots = 32
		t_obj.game = Game.find(1)
		assert !t_obj.save, 'name cannot be longer than 128 chars'
	end
	test '1b' do
		t_obj = Tourney.new
		t_obj.name = 'Name'
		t_obj.open_slots = 32
		t_obj.max_slots = 32
		t_obj.game = Game.find(1)
		t_obj.save
		
		alt_obj = Tourney.new
		alt_obj.name = 'Name'
		alt_obj.open_slots = 32
		alt_obj.max_slots = 32
		alt_obj.game = Game.find(1)
		assert !alt_obj.save, 'tourney names should be unique'
	end
	test '2' do
		t_obj = Tourney.new
		t_obj.in_stage = 'abcdefghijklmnopqrstuvwxyz1234567890'
		t_obj.open_slots = 32
		t_obj.max_slots = 32
		t_obj.game = Game.find(1)
		assert !t_obj.save, 'in_stage cannot be longer than 32 chars'
	end
	test '3' do
		t_obj = Tourney.new
		t_obj.open_slots = 16
		t_obj.game = Game.find(1)
		assert !t_obj.save, 'max_slots cannot be empty'
	end
	test '4' do
		t_obj = Tourney.new
		t_obj.max_slots = 32
		t_obj.game = Game.find(1)
		assert !t_obj.save, 'open_slots cannot be empty'
	end
	test '5' do
		t_obj = Tourney.new
		t_obj.open_slots = 32
		t_obj.max_slots = 'A String'
		t_obj.game = Game.find(1)
		assert !t_obj.save, 'max_slots must be an integer'
	end
	test '6' do
		t_obj = Tourney.new
		t_obj.open_slots = 'A String'
		t_obj.max_slots = 32
		t_obj.game = Game.find(1)
		assert !t_obj.save, 'open_slots must be an integer'
	end
	test '7' do
		t_obj = Tourney.new
		t_obj.open_slots = 32
		t_obj.max_slots = 32
		t_obj.season_num = 'A String'
		t_obj.game = Game.find(1)
		assert !t_obj.save, 'season_num must be an integer'
	end
	test '8' do
		t_obj = Tourney.new
		t_obj.open_slots = 32
		t_obj.max_slots = 32
		t_obj.is_autofill = 'A String'
		t_obj.game = Game.find(1)
		assert !t_obj.save, 'is_autofill must be a boolean'
	end
	test '9' do
		t_obj = Tourney.new
		t_obj.open_slots = 32
		t_obj.max_slots = 32
		t_obj.is_roundrobin = 'A String'
		t_obj.game = Game.find(1)
		assert !t_obj.save, 'is_roundrobin must be a boolean'
	end
	test '10' do
		t_obj = Tourney.new
		t_obj.open_slots = 32
		t_obj.max_slots = 32
		assert !t_obj.save, 'tourney must have a game set'
	end
end