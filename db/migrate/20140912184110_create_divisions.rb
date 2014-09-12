class CreateDivisions < ActiveRecord::Migration
	def change
		create_table :divisions do |t|
			t.string :name, :null => false, :limit => 32
			t.timestamps
		end
	end
end