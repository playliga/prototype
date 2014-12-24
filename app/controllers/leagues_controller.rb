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
		league_obj.save!
		
		tourney_obj = Tourney.new
		tourney_obj.league = league_obj
		tourney_obj.game = Game.find(league_obj.game_id)
		tourney_obj.division = Division.find(1);
		tourney_obj.is_autofill = league_obj.is_autofill
		tourney_obj.max_slots = 128;
		tourney_obj.open_slots = 128;
		tourney_obj.save!
		
		#puts league_obj.to_yaml
		#puts tourney_obj.to_yaml
		render :json => league_obj, :status => :created
	end

=begin
all divisions in league's current season should be set to ready status.
generate the matches for each division.
	only one group.
	open: 8 games/player
	IM/I: 16 games/player (faces opponent twice)
create helper function that generates matches from a list of competitors.
	optional arg of how many times they face each other.
=end
	def start
		league_obj = League.find(params[:id])
		tourney_arr = Tourney.where('league_id = ? AND season_num = ?', league_obj.id, league_obj.current_season)
		
		# abort if a tourney is found that is not ready
		tourney_not_ready = tourney_arr.find {|s| s.in_stage != Tourney::STAGE_READY}
		unless tourney_not_ready.nil?
			render :json => 'Divisions found that are not yet ready', :status => :forbidden
		end
		
		# loop through each division and generate matches.
		# create helper function for generating matches. optional arg of how many times to face an opponent.
		tourney_arr.each do |tourney_obj|
			# if open, 8 games/player
			# else 16 games/player (faces an opponent twice)
		end
	end
	
	def record_not_found
		render :json => {}
	end
end