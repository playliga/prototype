class CreateCompetitorMatches < ActiveRecord::Migration
	def change
		create_table :competitor_matches do |t|
			t.belongs_to :competitor, index: true
			t.belongs_to :match, index: true
			t.integer :score, :null => true
			
			t.timestamps
		end
	end
end
