Rails.application.routes.draw do
	resources :leagues, :competitors, except: [:new, :edit]
end