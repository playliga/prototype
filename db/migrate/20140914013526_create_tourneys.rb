class CreateTourneys < ActiveRecord::Migration
	def change
		create_table :tourneys do |t|
			t.string :name, :limit => 128
			t.string :in_stage, :limit => 32, :null => true, :default => 'Building'
			t.integer :max_slots, :null => false
			t.integer :open_slots, :null => false
			t.integer :season_num, :null => true, :default => 1
			t.boolean :is_autofill, :null => true, :default => 1
			t.boolean :is_roundrobin, :null => true, :default => 1
			
			t.belongs_to :division
			t.belongs_to :game, :null => false
			t.belongs_to :league
			t.timestamps
		end
	end
end