Rails.application.routes.draw do
	resources :leagues, except: [:new, :edit]
end