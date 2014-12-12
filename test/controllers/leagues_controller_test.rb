require 'test_helper'

class LeaguesControllerTest < ActionController::TestCase
	test 'index returns all leagues' do
		get :index
		leagues_arr = JSON.parse(@response.body)
		assert leagues_arr.kind_of?(Array)
		assert_response :success
	end
	test 'show a league by id' do
		get :show, { id:1 }
		league_obj = JSON.parse(@response.body)
		assert league_obj['name']
		assert_response :success
	end
	test 'create league' do
		league_obj = League.new
		league_obj.name = 'Serie A'
		league_obj.game_id = 1
		post :create, league_obj.to_json, 'CONTENT_TYPE' => 'application/json'
		assert_response :created
		
		response_obj = League.new
		response_obj.from_json(response.body)
		assert response_obj.id.is_a? Integer
		
		1.is_a? Integer
	end
end