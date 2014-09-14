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
end