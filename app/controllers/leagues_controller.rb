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
	def start
		league_obj = League.find(params[:id])
		tourney_arr = Tourney.where('league_id = ? AND season_num = ?', league_obj.id, league_obj.current_season)
		
		tourney_not_ready = tourney_arr.find {|s| s.in_stage != Tourney::STAGE_READY}
		unless tourney_not_ready.nil?
			render :json => 'Divisions found that are not yet ready', :status => :forbidden
		end
		
		tourney_arr.each do |tourney_obj|
			comps_arr = tourney_obj.competitors
			comps_match_set = Array.new
			
			comps_arr.each do |competitor|
				comps_match_set.push(competitor)
				if comps_match_set.length % 9 == 0
					num_times = tourney_obj.division.name == 'Open'? 1: 2
					matches_arr = Tourney.gen_matches(comps_match_set, num_times)
					
					matches_arr.each do |match|
						match_obj = Match.new
						match_obj.tourney = tourney_obj
						
						comp_one = Competitor.where({tourney_id: tourney_obj.id, name: match[0]}).first
						comp_two = Competitor.where({tourney_id: tourney_obj.id, name: match[1]}).first
						
						match_obj.competitors = [comp_one, comp_two]
						match_obj.save
					end
					comps_match_set.clear
				end
			end
		end
		
		render :json => 'League successfully started'
	end
	
	def record_not_found
		render :json => {}
	end
end