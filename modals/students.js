const mongoose = require('mongoose');
const Course = require("./courses")

const StudentSchema = new mongoose.Schema({
	email         : {
		type     : String,
		required : true
	},
	course_title       :{
		type      :String,
		required   : true
	},
	duration      :{
		type	  :String,
		
	},
	start_date	  :{
		type	  :Date
	},
	f_time		:{
		type	:String
	},
	t_time		:{
		type	:String
	},
	name		:{
		type	:String
	}
	
});

const Student = mongoose.model('Student', StudentSchema);

module.exports = Student;
