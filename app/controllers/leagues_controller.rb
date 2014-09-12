class LeaguesController < ApplicationController
	rescue_from ActiveRecord::RecordNotFound, with: :record_not_found
	
	def index
		leagues_arr = League.all
		render :json => leagues_arr
	end
	
	def show
		league_obj = League.find(params[:id])
		render :json => league_obj
	end
	
	def record_not_found
		render :json => {}
	end
end