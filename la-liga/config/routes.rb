Rails.application.routes.draw do
    namespace :core do
        resources :users
    end
end
