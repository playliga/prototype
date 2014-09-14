require 'test_helper'

class DivisionTest < ActiveSupport::TestCase
	test 'dont allow empty division name' do
		div_obj = Division.new
		assert !div_obj.save
	end
	test 'dont allow division names longer than 32' do
		div_obj = Division.new
		div_obj.name = 'abcdefghijklmnopqrstuvwxyz1234567890'
		assert !div_obj.save
	end
	test 'division names are unique' do
		div_obj = Division.new
		div_obj.name = 'Placement'
		div_obj.save
		
		div_obj = Division.new
		div_obj.name = 'Placement'
		assert !div_obj.save
	end
end