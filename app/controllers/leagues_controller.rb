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
		request_body = request.body.read
		league_obj = League.new
		league_obj.from_json(request_body)
		league_obj.save
		
		# create tourney object.
		# cant set autofill. must append league autofill field.
		tourney_obj = Tourney.new
		tourney_obj.league = league_obj
		tourney_obj.game = Game.find(league_obj.game_id)
		tourney_obj.division = Division.find(1);
		tourney_obj.max_slots = 128;
		tourney_obj.open_slots = 128;
		
		puts league_obj.to_yaml
		puts tourney_obj.to_yaml
		render :json => request.body.read, :status => :created
	end
	
	def record_not_found
		render :json => {}
	end
end