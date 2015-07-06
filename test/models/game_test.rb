require 'test_helper'

class GameTest < ActiveSupport::TestCase
	test 'dont allow empty game names' do
		game = Game.new
		assert !game.save
	end
	test 'dont allow empty game short name' do
		game = Game.new
		game.name = 'Counter-Strike'
		assert !game.save
	end
	test 'game names no longer than 64' do
		game = Game.new
		game.name = 'abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz1234567890'
		game.short_name = 'cstrike'
		assert !game.save
	end
	test 'game short name no longer than 8' do
		game = Game.new
		game.name = 'Counter-Strike'
		game.short_name = 'cstrikelongerthaneight'
		assert !game.save
	end
	test 'game names are unique' do
		game = Game.new
		game.name = 'Counter-Strike'
		game.short_name = 'csrike'
		game.save
		
		alt_game = Game.new
		alt_game.name = 'Counter-Strike'
		alt_game.short_name = 'czero'
		assert !game.save
	end
	test 'game short_name are unique' do
		game = Game.new
		game.name = 'Counter-Strike'
		game.short_name = 'cstrike'
		game.save
		
		alt_game = Game.new
		alt_game.name = 'Condition-Zero'
		alt_game.short_name = 'cstrike'
		assert !game.save
	end
end