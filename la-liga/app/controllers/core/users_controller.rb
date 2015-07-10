class Core::UsersController < ApplicationController
    before_action :authenticate_token

    def index
        render :json => {}
    end
end
