require 'test_helper'

class CompetitorsControllerTest < ActionController::TestCase
	test 'create competitor' do
		obj = Competitor.new
		post :create, obj.to_json, 'CONTENT_TYPE' => 'application/json'
		assert_response :created
	end
end
