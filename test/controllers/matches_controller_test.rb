require 'test_helper'

class MatchesControllerTest < ActionController::TestCase
	test 'submitting match result' do
		match_results = []
		match_results.push({:competitor_id => 129, :score => 2})
		match_results.push({:competitor_id => 130, :score => 1})
		
		put :update, match_results.to_json, 'CONTENT_TYPE' => 'application/json', :id => 2
		assert_response :success
	end
	test 'submitting match result with fake competitor' do
		match_results = []
		match_results.push({:competitor_id => 1337, :score => 2})
		match_results.push({:competitor_id => 130, :score => 1})
		
		put :update, match_results.to_json, 'CONTENT_TYPE' => 'application/json', :id => 2
		assert_response :forbidden
	end
end