Rails.application.routes.draw do
	resources :leagues, :competitors, except: [:new, :edit]
	
	# competitors have a secondary create route that adds to a league.
	post '/competitors/league/:id', to: 'competitors#create_league'
end