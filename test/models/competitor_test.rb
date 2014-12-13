require 'test_helper'

class CompetitorTest < ActiveSupport::TestCase
	test 'name length' do
		c_obj = Competitor.new
		c_obj.name = 'abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz1234567890abcdefghijklmnopqrstuvwxyz1234567890'
		assert !c_obj.save, 'name cannot be longer than 64 chars'
	end
end
