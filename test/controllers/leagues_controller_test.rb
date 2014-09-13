require 'test_helper'

class LeaguesControllerTest < ActionController::TestCase
	test 'index sends json response' do
		get :index
		leagues_arr = JSON.parse(@response.body)
		assert leagues_arr.kind_of?(Array)
		assert_response :success
	end
	test 'show sends league json response' do
		get :show, { id:1 }
		league_obj = JSON.parse(@response.body)
		assert league_obj['name']
		assert_response :success
	end
	test 'create sends new league object' do
		post :create, { name:'Ligue 1', game_id:2 }
		league_obj = JSON.parse(@response.body)
		assert league_obj['id'].is_a?(Integer)
		assert_response :success
	end
end