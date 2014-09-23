class CreateGames < ActiveRecord::Migration
	def change
		create_table :games do |t|
			t.string :name, :null => false, :limit => 64
			t.string :short_name, :null => false, :limit => 8
			t.timestamps
		end
	end
end