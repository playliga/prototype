class CompetitorsController < ApplicationController
	rescue_from ActiveRecord::RecordNotFound, with: :record_not_found
	
	def create
		obj = Competitor.new
		puts obj.to_yaml
		
		render :json => obj, :status => :created
	end
	
	def record_not_found
		render :json => {}
	end
end
