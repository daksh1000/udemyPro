const mongoose = require('mongoose');

 const CourseSchema = new mongoose.Schema({
	email         : {
		type     : String,
		required : true
    },
    course_title  :{
        type     : String,
        required  : true
    },
    course_description:{
        type     : String,
        required  : true
    },
    duration:{
        type     :String,
        required: true
    },
    start_date:{
        type    :Date,
        required:true
    },
    end_date:{
        type    :Date,
        required:true
    },
    min:{
        type    :Number,
        required:true
    },
    max:{
        type    :Number,
        required:true
    },
    noOfStudents:{
        type    :Number,
    },
    price:{
        type    :String,
        required:true
    },
    status:{
        type    :String,
        required:true
    }
	
});

const Course = mongoose.model('Course', CourseSchema);

module.exports = Course;