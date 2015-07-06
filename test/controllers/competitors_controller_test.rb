require 'test_helper'

class CompetitorsControllerTest < ActionController::TestCase
=begin
we want to add team 3d to the cstrike 1.6 league.
we pass in that league id through url param.

it is assumed that the cstrike 1.6 league exists and is in its placement season. MUST CREATE FIXTURES.
=end
	test 'adding competitor to leagues first season' do
		obj = Competitor.new
		obj.name = "Team 3D"
		post :create_league, obj.to_json, 'CONTENT_TYPE' => 'application/json', :id => 2
		
		assert_response :created
		
		response_obj = Competitor.new
		response_obj.from_json(response.body)
		
		assert (response_obj.id.is_a? Integer), "response did not send competitor id. save failed."
		assert response_obj.tourney.division.id == 1, "division was not set to placement"
	end
end
