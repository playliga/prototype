class CreateGroups < ActiveRecord::Migration
	def change
		create_table :groups do |t|
			t.integer :group_num, :null => false
			
			t.belongs_to :tourney, :null => false
			t.timestamps
		end
	end
end