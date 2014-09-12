require 'test_helper'

class LeagueTest < ActiveSupport::TestCase
	test 'dont allow empty names' do
		league = League.new
		assert !league.save
	end
	test 'dont allow names longer than 64 chars' do
		league = League.new
		league.name = 'abcdefghijklmnopqrstuvwxyz1234567890zyxwvutsrqponmlkjihgfedcda0987654321'
		assert !league.save
	end
	test 'only allow integers for current season' do
		league = League.new
		league.name = 'Primera Division'
		league.current_season = 'String Here'
		assert !league.save
	end
	test 'unique league names' do
		league = League.new
		league.name = 'Primera Division'
		league.save
		
		alt_league = League.new
		league.name = 'Primera Division'
		assert !league.save
	end
	test 'default season num should be 1' do
		league = League.new
		league.name = 'Primera Division'
		league.save
		
		assert_equal(1, league.current_season)
	end
end