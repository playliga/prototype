class CreateCoreUsers < ActiveRecord::Migration
    def change
        create_table :core_users do |t|
            t.string :username, :limit => 64, :null => false
            t.string :password_digest, :null => false
            t.string :api_key, :limit => 255, :null => true
            t.timestamps null: false
        end
    end
end
