class CreateMatches < ActiveRecord::Migration
	def change
		create_table :matches do |t|
			t.integer :group_num, :null => true
			t.integer :bracket_num, :null => true
			t.integer :bracket_round_num, :null => true
			t.integer :bracket_round_game_num, :null => true
			t.boolean :is_reported, :null => true, :default => 0
			
			t.belongs_to :tourney, :null => false
			t.timestamps
		end
	end
end
