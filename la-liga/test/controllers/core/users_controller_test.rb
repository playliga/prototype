require 'test_helper'

class Core::UsersControllerTest < ActionController::TestCase
    self.set_fixture_class '/core/users' => Core::User

    test 'token auth ok' do
        token = core_users(:lemonpole).api_key
        @request.headers['Authorization'] = "Token token=#{token}"
        get :index
        
        assert_response :success
    end
    test 'token auth not ok' do
        @request.headers['Authorization'] = 'Token token="bogus token"'
        get :index

        assert_response :unauthorized
    end
end
