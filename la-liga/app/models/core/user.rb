class Core::User < ActiveRecord::Base
    validates :name, length:{ maximum: 64 }, presence: true
    validates :password, length:{ minimum: 6 }, presence: true
    
    has_secure_password
end
