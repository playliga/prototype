require 'test_helper'

class TourneyTest < ActiveSupport::TestCase
	test '1' do
		t_obj = Tourney.new
		t_obj.name = 'abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz1234567890'
		t_obj.open_slots = 32
		t_obj.max_slots = 32
		t_obj.game = games(:cstrike)
		assert !t_obj.save, 'name cannot be longer than 128 chars'
	end
	test '1b' do
		t_obj = Tourney.new
		t_obj.name = 'Name'
		t_obj.open_slots = 32
		t_obj.max_slots = 32
		t_obj.game = games(:cstrike)
		t_obj.save
		
		alt_obj = Tourney.new
		alt_obj.name = 'Name'
		alt_obj.open_slots = 32
		alt_obj.max_slots = 32
		alt_obj.game = games(:cstrike)
		assert !alt_obj.save, 'tourney names should be unique'
	end
	test '2' do
		t_obj = Tourney.new
		t_obj.in_stage = 'abcdefghijklmnopqrstuvwxyz1234567890'
		t_obj.open_slots = 32
		t_obj.max_slots = 32
		t_obj.game = games(:cstrike)
		assert !t_obj.save, 'in_stage cannot be longer than 32 chars'
	end
	test '3' do
		t_obj = Tourney.new
		t_obj.open_slots = 16
		t_obj.game = games(:cstrike)
		assert !t_obj.save, 'max_slots cannot be empty'
	end
	test '4' do
		t_obj = Tourney.new
		t_obj.max_slots = 32
		t_obj.game = games(:cstrike)
		assert !t_obj.save, 'open_slots cannot be empty'
	end
	test '5' do
		t_obj = Tourney.new
		t_obj.open_slots = 32
		t_obj.max_slots = 'A String'
		t_obj.game = games(:cstrike)
		assert !t_obj.save, 'max_slots must be an integer'
	end
	test '6' do
		t_obj = Tourney.new
		t_obj.open_slots = 'A String'
		t_obj.max_slots = 32
		t_obj.game = games(:cstrike)
		assert !t_obj.save, 'open_slots must be an integer'
	end
	test '7' do
		t_obj = Tourney.new
		t_obj.open_slots = 32
		t_obj.max_slots = 32
		t_obj.season_num = 'A String'
		t_obj.game = games(:cstrike)
		assert !t_obj.save, 'season_num must be an integer'
	end
	test '9' do
		t_obj = Tourney.new
		t_obj.open_slots = 32
		t_obj.max_slots = 32
		assert !t_obj.save, 'tourney must have a game set'
	end
	test '10' do
		NUM_TIMES_TO_FACE = 2
		comps_arr = Competitor.take(9)
		matches_arr = Tourney.gen_matches(comps_arr, NUM_TIMES_TO_FACE)
		
		matches_arr.each do |item|
			match_obj = Match.new
			match_obj.tourney_id = comps_arr[0].tourney.id
			match_obj.group_num = comps_arr[0].group_num
			
			p1 = Competitor.where({name: item[0], tourney_id: comps_arr[0].tourney.id}).first
			p2 = Competitor.where({name: item[1], tourney_id: comps_arr[0].tourney.id}).first
			match_obj.competitors = [p1, p2]
			match_obj.save
		end
		
		total_num_games = (comps_arr.length - 1) * NUM_TIMES_TO_FACE
		comps_arr.each do |competitor|
			assert competitor.matches.length == total_num_games, 'number of times to face an opponent not working'
		end
	end
end