class LeaguesController < ApplicationController
	def index
		leagues_arr = League.all
		render :json => leagues_arr
	end
	
	def show
		# TODO
	end
end