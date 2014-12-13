class CreateCompetitors < ActiveRecord::Migration
	def change
		create_table :competitors do |t|
			t.string :alias, :limit => 64, :null => false
			t.integer :group_num, :null => true
			t.integer :wins, :null => true, :default => 0
			t.integer :loss, :null => true, :default => 0
			t.integer :draw, :null => true, :default => 0
			t.integer :placement_num, :null => true
			t.boolean :is_eliminated, :null => true, :default => 0
			
			t.belongs_to :tourney, :null => false
			t.timestamps
		end
	end
end