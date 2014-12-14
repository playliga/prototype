class CompetitorsController < ApplicationController
	rescue_from ActiveRecord::RecordNotFound, with: :record_not_found
	
=begin
by season 2, the league will have multiple divisions.
so look for open division for leagues current season.
=end
	def create_league
		c_obj = Competitor.new
		c_obj.from_json(request.body.read)
		l_obj = League.find(params[:id])
		
		# get tourney id.
		# if leagues current season is 1, look for placement.
		# if leagues current season is >= 2, look for open.
		if l_obj.current_season == 1
			tourney_id = l_obj.tourneys[0].id # placement should always be first tourney result.
		else
			# todo: find leagues open division for current season.
		end
		
		# find tourney object.
		# add player to tourney if slots are greater than zero.
		# adjust open slots.
		t_obj = Tourney.find(tourney_id)
		if t_obj.open_slots > 0 # are we checking for stage as well?...
			c_obj.tourney = t_obj
			t_obj.open_slots -= 1
		end
		
		# adjust stage if slots reach 0.
		if t_obj.open_slots == 0
			t_obj.in_stage = 'Ready' # todo: make stages into global constants...
		end
		
		# save work, return data.
		c_obj.save
		t_obj.save
		render :json => c_obj, :status => :created
	end
	
	def record_not_found
		render :json => {}
	end
end
