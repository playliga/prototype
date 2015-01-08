require 'test_helper'

class MatchesControllerTest < ActionController::TestCase
	test 'submitting match result' do
		put :update, 'do work', 'CONTENT_TYPE' => 'application/json', :id => 2
		assert_response :success
	end
end