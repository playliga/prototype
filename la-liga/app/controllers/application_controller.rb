class ApplicationController < ActionController::Base
    protected
    def authenticate_token
        is_token_valid? || render_unauthorized
    end
    def is_token_valid?
        authenticate_with_http_token do |token, options|
            @user_obj = Core::User.find_by(api_key: token)
        end
    end
    def render_unauthorized
        self.headers['WWW-Authenticate'] = 'Token realm="La Liga"'
        render :json => 'Access denied', :status => :unauthorized
    end

    def authenticate_http_basic
        authenticate_with_http_basic do |username, password|
            user_obj = Core::User.find_by(username: username)

            # TODO: update user object with new generated token
            if user_obj && user_obj.password == password
                render :json => 'return generated token here', :status => :success
            else
                render :json => 'Access denied', :status => :unauthorized
            end
        end
    end
end
