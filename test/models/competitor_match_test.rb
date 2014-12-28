require 'test_helper'

class CompetitorMatchTest < ActiveSupport::TestCase
	test 'score_integer' do
		cm_obj = CompetitorMatch.new
		cm_obj.match = Match.find(1)
		cm_obj.competitor = Competitor.find(1)
		cm_obj.score = 'obviously not an integer'
		assert !cm_obj.save, 'score attribute can only be an integer'
	end
end
