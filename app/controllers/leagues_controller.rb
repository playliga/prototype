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
	def create
		# fetch league object from request body.
		# create league with information passed along.
			# name, game, autofill.
				# autofill is true by default if not passed.
		# using league_id from above; create tourney pointing to league_id and placement division with 128(?) slots.
		puts request.body.read
	end
	
	def record_not_found
		render :json => {}
	end
end