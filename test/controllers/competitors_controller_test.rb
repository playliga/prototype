require 'test_helper'

class CompetitorsControllerTest < ActionController::TestCase
	test 'create league competitor' do
		obj = Competitor.new
		obj.name = "cooller"
		post :create_league, obj.to_json, 'CONTENT_TYPE' => 'application/json', :id => 1
	end
end
