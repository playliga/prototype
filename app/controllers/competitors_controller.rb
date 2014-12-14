class CompetitorsController < ApplicationController
	rescue_from ActiveRecord::RecordNotFound, with: :record_not_found
	
=begin
access league id url param.
get competitor object. (name)
find the league's current season.
if 1, add to placement tourney.
if 2, add to open division.
only the tourney_id and name field must be set.
=end
	def create_league
		c_obj = Competitor.new
		c_obj.from_json(request.body.read)
		l_obj = League.find(params[:id])
		
		# get tourney id.
		# if leagues current season is 1, look for placement.
		# if leagues current season is >= 2, look for open.
		if l_obj.current_season == 1
			c_obj.tourney = l_obj.tourneys[0] #placement should always be first tourney result.
		end
		
		c_obj.save
		render :json => c_obj, :status => :created
	end
	
	def record_not_found
		render :json => {}
	end
end
