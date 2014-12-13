class CompetitorsController < ApplicationController
	rescue_from ActiveRecord::RecordNotFound, with: :record_not_found
	
	def create_league
		puts request.body.read
	end
	
	def record_not_found
		render :json => {}
	end
end
