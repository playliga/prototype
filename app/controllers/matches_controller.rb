class MatchesController < ApplicationController
	def update
		match_obj = Match.find(params[:id])
		tourney_obj = Tourney.find(match_obj.tourney.id)
		match_comps_arr = match_obj.competitor_matches
		match_results = JSON.parse(request.body.read)
		
		# has the match been reported already?
		if match_obj.is_reported
			render :json => 'Match has already been reported.', :status => :forbidden
			return
		end
		
		# loop through results provided and update the scores.
		# abort if a comp_id provided is not part of the match
		match_results.each do |item|
			cm_obj = match_comps_arr.find{|o| o.competitor_id == item['competitor_id'].to_i}
			if cm_obj.nil?
				render :json => 'Competitor provided not found. Aborted.', :status => :forbidden
				return
			end
			cm_obj.score = item['score']
		end
		
		# match input competitors to match competitors.
		p1_obj = match_obj.competitors.find{|o| o.id == match_comps_arr[0].competitor_id}
		p2_obj = match_obj.competitors.find{|o| o.id == match_comps_arr[1].competitor_id}
		
		# do we need to update the competitors' w/l/d record?
		if tourney_obj.in_stage == Tourney::STAGE_GROUPS
			if match_comps_arr[0].score > match_comps_arr[1].score
				p1_obj.wins += 1
				p2_obj.loss += 1
			elsif match_comps_arr[0].score < match_comps_arr[1].score
				p1_obj.loss += 1
				p2_obj.wins += 1
			else
				p1_obj.draw += 1
				p2_obj.draw += 1
			end
		end
		
		# check for any events that need to be raised. (ie: end of season, last bracket round, etc)
		# end of group stage? Set status to waiting.
		
		render :json => 'match updated'
	end
end