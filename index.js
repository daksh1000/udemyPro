const express = require("express")
const bodyParser = require("body-parser")
const app = express();
const mongoose = require("mongoose")
const cookieParser = require('cookie-parser')
const bcrypt = require("bcryptjs")
const jwt = require("jsonwebtoken")
const verifi = require("./verifyTokens")
const moment = require("moment");
var path = require('path')
const ejs = require("ejs");
const nodemailer = require("nodemailer");
var handlebars = require('handlebars');
var fs = require('fs');
const User = require("./modals/users");
const Course = require("./modals/courses");
const session = require("express-session");
const flash = require("connect-flash");
const Student = require("./modals/students")
require('dotenv').config();
const url = process.env.MONGODB_URL;
const passwordValidator = require('password-validator');
const check = new passwordValidator();
let Logged_in=false
let Role = ""
let cour =""
let show_edit = false
let enrolled = "Click below to Enrol"
var _ = require('lodash');
let m = moment()
const cron = require('node-cron');
a = m.format("L")
console.log(typeof(a))
console.log(m.date())



cron.schedule('40 35 17 * * *', () => {
	Student.find({},(err,foundUser)=>{
		if(err){
			console.log(err)
		}
		else{
			let m = moment()
			foundUser.forEach(function(stu){
				let l = moment(stu.start_date)
				let r = moment(stu.start_date)
				l = l.subtract(1,"d")
				console.log(l)
				
				if(m.date()===l.date() && m.month()===l.month() && m.year()===l.year()){
					var readHTMLFile = function(path, callback) {
						fs.readFile(path, {encoding: 'utf-8'}, function (err, html) {
							if (err) {
								throw err;
								callback(err);
							}
							else {
								callback(null, html);
							}
						});
					};
					// const transporter = nodemailer.createTransport({
					// 	service:'gmail',
					// 	auth :{
					// 		user:'daksh008546@gmail.com',
					// 		pass:process.env.PASS
					// 	}
					// })
					var transporter = nodemailer.createTransport({
						host: "smtp.mailtrap.io",
						port: 2525,
						auth: {
						  user: "4ae3c609d392c1",
						  pass: process.env.PASS
						}
					  });
					readHTMLFile(__dirname + '/public/abc.html', function(err, html) {
						var template = handlebars.compile(html);
						var replacements = {
							 course_t: stu.course_title,
							 st_date: r.format("L"),
							 name:stu.name,
							 duration:stu.duration,
							 f_time:stu.f_time,
							 t_time:stu.t_time
						};
						var htmlToSend = template(replacements);
					const mailOptions = {
						from : 'daksh008546@gmail.com',
						to :stu.email,
						subject :stu.course_title,
						html : htmlToSend
			 
					}
					
				  try{
					transporter.sendMail(mailOptions,(error,info)=>{
					  if(error){
						  console.log(error)
						  console.log("EMAIL ERROR: if "+err)
					  }else{
						  console.log(" cron shoots, Email sent : "+ info.response)
					  }
					})}catch{(err)=>{
						console.log("EMAIL ERROR: catch "+err)
					}

					}
				});
				
					
				}
				
			});
			
		}
	})
	console.log('running a task every minute');
  });

  

// console.log(m.toISOString());
// a=m.subtract(2,'d')
// console.log(a.toISOString());


mongoose.connect(url, {useNewUrlParser: true, useUnifiedTopology: true,  useFindAndModify: false });

mongoose.connection.on('error', err => {
	console.log(err);
  });
  mongoose.connection.on('disconnected', function () {  
	console.log('Mongoose default connection disconnected'); 
  });

app.use(cookieParser())
app.use(bodyParser.urlencoded({extended:true}));
app.use(bodyParser.json());
// app.use(express.static("public"));
app.use(express.static(path.join(__dirname, '/public')));
app.use(session({
	secret:process.env.SEC,
	resave:false,
	saveUninitialized:false

}))
app.use(flash());
app.set('view engine',"ejs");








//Api Endpoints

app.get("/",async(req,res)=>{
	enrolled="Click below to enroll"
	if(req.cookies['jwt']){
		try{
		
			const course = await Course.find({start_date:{$gte: new Date()}}).exec();
			try{
					res.render('all_course', {
						courses  : course,
						rol      : req.cookies['role'],
						message  : req.flash('message')		
					});
			}catch (err){
				console.log(err)
				res.render("all_u")
			}
		}catch(err){
			console.log(err)
			res.render("all_u")
		}

	}else{
		try{
			const course = await Course.find({start_date:{$gte: new Date()}}).exec();
			try{
					res.render('home', {
						courses  : course	
					});
			}catch (err){
				console.log(err)
				res.render("all_u")
			}}catch(err){
				console.log(err)
				res.render("all_u")
			}
	}
		
			
  
})

// app.get("/home",verifi,async(req,res)=>{
// 	try{
		
// 		const course = await Course.find({start_date:{$gte: new Date()}}).exec();
// 		try{
// 				res.render('all_course', {
// 					courses  : course,
// 					rol      : req.body.role,
// 					message  : req.flash('message')		
// 				});
// 		}catch (err){
// 			console.log(err)
// 			res.render("all_u")
// 		}
// 	}catch(err){
// 		console.log(err)
// 		res.render("all_u")
// 	}

// })



//Register Route
app.get("/register",(req,res)=>{
	
	if(!req.cookies['jwt']){
		console.log(req.cookies)
		res.render("register")
	}
	else{
		res.redirect("/");
	}
})


app.post("/register",(req,res)=>{
	const role="student"
    
  const { name, phone, email, password, password2 } = req.body;

  
  
  check.has().uppercase().has().lowercase().has().digits(2);
  let errors = [];
	if (!name || !email || !password || !password2) {
		errors.push({ msg: 'All fields are compulsory' });
	}
	if (phone.length != 10) {
		errors.push({ msg: 'Wrong Phone number' });
	}
	if (password.length < 6) {
		errors.push({ msg: 'Passwords too short' });
	}
	if (check.validate(password) == false) {
		errors.push({ msg: 'Password too weak' });
	}
	if (password != password2) {
		errors.push({ msg: 'Passwords do not match' });
	}
  
	if (errors.length > 0) {
		res.render('register', { errors, name, email, password, password2 });
	} else {
		User.findOne({ email: email })
			.then((user) => {
				if (user) {
					errors.push({ msg: 'Email already exists' });
					res.render('register', { errors, name, email, password, password2 });
				} else {
					
					const newUser = new User({
						name,
						email,
						password,
						phone,
						role
						// profile_img : loc.url
					});
					
					bcrypt.genSalt(10, (err, salt) => {
						bcrypt.hash(newUser.password, salt, (err, hash) => {
							if (err) {
								console.log(err);
							} else {
								newUser.password = hash;
								
								newUser.save();
								res.redirect('/login');
							}
						});
					});
				}
			})
			.catch((e) => console.log(e));
    }

    
})



//Login
app.get("/login",(req,res)=>{
	if(!req.cookies['jwt']){
		console.log(req.cookies)
		res.render("login")
	}
	else{
		res.redirect("/");
	}
  
})

app.post("/login",(req,res)=>{
	User.findOne({email: req.body.email},(err,foundUser)=>{
		if(err){
			console.log(err)
		}
		else{
			if(foundUser){
				bcrypt.compare(req.body.password, foundUser.password, function(err, result) {
					    if(result === true){
							Role = foundUser.role
							Logged_in = true
							const token = jwt.sign({email:foundUser.email,role:foundUser.role,name:foundUser.name},process.env.SECRET,{ expiresIn: '1h' });
						
							// res.header('auth-token',token)
							res.cookie("jwt", token, {secure: true, httpOnly: true})
							res.cookie("role",foundUser.role,{secure: true, httpOnly: true})
							req.flash('message','Logged in Successfully')
    						res.redirect("/")
							
					      
					
						}else{
							res.redirect("/login")
						}
						
					});

			}else{
				res.redirect("/login")
			}

		}
	}
	)
	console.log(req.body);
})

app.get("/student/:page",verifi,(req,res)=>{
	if(req.user.role==="admin"){
		var perPage = 3
    var page = req.params.page || 1
 
    User
        .find({})
        .skip((perPage * page) - perPage)
        .limit(perPage)
        .exec(function(err, users) {
            User.countDocuments().exec(function(err, count) {
                if (err) return next(err)
				res.render('abc',
				{
                    user:users,
					current: page,
					rol:req.user.role,
                    pages: Math.ceil(count / perPage)
				}
				)
            })
        })
	}else{
		res.render("all_u")
	}
	
	
	
})



app.get("/logout",(req,res)=>{
	enrolled = "Click below to Enrol"
	Logged_in = false
	res.clearCookie("jwt");
	res.clearCookie("role");
	
	res.redirect("/")
})


//Admin side
app.get("/course/add-course",verifi,(req,res)=>{
	
	if(req.user.role==="admin"){
	
		res.render("admin")
	}
	else{
		res.send("Permission for this route is restricted")
	}
	
})

app.post("/course/add-course",verifi,(req,res)=>{
	let { course_title,course_description,duration,start_date,end_date,min,max,price,f_time,t_time} = req.body;

	
	email=req.user.email
	let status
	if(price=="0"){
		status="Free"
	}else{
		status=price
	}
	let errors = [];
	Course.find({course_title:course_title}, (err, courses) => {
		if(err){
			console.log(err)
		}else{
			if(courses.length>0)
			{
				errors.push({ msg: 'Title already exists' });
			}
			if (!course_title || !course_description|| !duration|| !start_date|| !end_date || !min || !max || !price|| !f_time || !t_time) {
				errors.push({ msg: 'All fields are compulsory' });
			}
			if (errors.length > 0) {
				res.render('admin', { errors,course_title,course_description,duration,start_date,end_date,min,max,price,f_time,t_time });
			}else{
				const newCourse = new Course({
					email,
					course_title,
					course_description,
					duration,
					start_date,
					end_date,
					min,
					max	,
					price,
					status,
					f_time,
					t_time
		
		
			});
			newCourse.save((err)=>{
				if(err){
					console.log(err)
					res.redirect("/admin")
				}
				else{
					console.log("successful saved")
					req.flash('message','Successfully Added')
					res.redirect("/user")
				}
			})
			
			
			}
		}
	})

	
	
	

	


})



//User
app.get("/user",verifi,(req,res)=>{
	enrolled="Click below to enroll"
	User.find({ email: req.user.email }, (err, use) =>{
		if(err){
			console.log(err)
		}else{
			if(req.user.role==="admin"){
				Course.find({ email: req.user.email }, (err, course) => {
					if (err) {
						console.log(err);
					} else {
						res.render('user', { 
							courses: course,
							user   :use,
							rol 	:req.user.role,
							message  : req.flash('message')	
						});
						
					}
				});
			}
			else{
				Student.find({email: req.user.email},(err, stud)=>{
					if(err){
						console.log(err)
					}else{
						res.render('user', { 
							students: stud,
							user   :use,
							rol		:req.user.role,
							message  : req.flash('message')	
							
						});
					}
				})
			}
			

		}
});

	// res.render("user");
})
app.post("/delete",verifi,(req,res)=>{
	let title =req.body.course_title;

	Course.findOneAndDelete({course_title:title},(err)=>{
		if(err){
			console.log(err);
		}else{
			Student.deleteMany({course_title:title},(err)=>{
				if(err){
					console.log(err);
				}else{
					console.log("Successfully Deleted")
					req.flash('message','Deleted Successfully')
					res.redirect("/user")
				}
			})
		}
	})

	
	
})




app.get("/course/email/:topic",verifi,(req,res)=>{
	if(req.user.role==="admin"){
		res.render("email")
	}else{
		res.render("all_u")
	}
})

app.post("/course/email",verifi,(req,res)=>{
	message=req.body.mess
	title = req.body.heading
	let errors = [];
	
	Student.find({course_title:cour},(err,stu)=>{
		if (err) {
			console.log(err);
		} else {
			if(stu.length>0){
				stu.forEach(function(stude){
					const mailOptions = {
						from : 'daksh008546@gmail.com',
						to :stude.email,
						subject :title,
						text : message
					}
					// const transporter = nodemailer.createTransport({
					// 	service:'gmail',
					// 	auth :{
					// 		user:'daksh008546@gmail.com',
					// 		pass:process.env.PASS
					// 	}
					// })
					var transporter = nodemailer.createTransport({
						host: "smtp.mailtrap.io",
						port: 2525,
						auth: {
						  user: "4ae3c609d392c1",
						  pass: process.env.PASS
						}
					  });
				  try{
					transporter.sendMail(mailOptions,(error,info)=>{
					  if(error){
						console.log("EMAIL ERROR: if "+error)
					  }else{
						  console.log("Email sent : "+ info.response)
						  req.flash('message','Email Sent')
						  res.redirect("/")
					  }
					})
				}catch{(err)=>{
					console.log("EMAIL ERROR: catch "+err)
				}}
				})
	
			}else{
				errors.push({ msg: 'No students have enrolled for this course' });
				if (errors.length > 0) {
					res.render('email', { errors:errors });
				}
			}
			
			
		
		}

	})
	
})




//Course_Profile
app.get('/course/:topic', verifi, (req, res) => {
	
	let course_enrolled = false
	const re = _.startCase(req.params.topic);
	cour = req.params.topic;
	show_edit=false
	Course.find({course_title:re,start_date:{$gte: new Date()}},(err, courses)=>{
		if(err){
			console.log(err)
		}
		else{
			if(courses.length>0){
				show_edit=true
				console.log(show_edit)
			}
			

		}
	})
	
	
	
	if(req.user.role=="student"){
		Student.find({email:req.user.email}, (err,foundUser)=>{
			if(err){
				console.log(err)
			}
			else{
				foundUser.forEach(function(use){
					if(use.course_title==re){
						course_enrolled=true
						console.log(course_enrolled)
					}
				})
			}
		})
		

	}
	
	Course.find({course_title:re}, (err, courses) => {
		enroll=enrolled
		if (err) {
			console.log(err);
		} else {
			console.log(re)
			console.log(show_edit)
			if(courses.length>0){
				Student.find({course_title:re},(err,stu)=>{
					if (err) {
						console.log(err);
					} else {
						res.render('course', {
							course : courses,
							user : req.user,
							student : stu,
							name : re,
							rol   :req.user.role,
							enroll  :enroll,
							co_enrolled  : course_enrolled,
							edit:show_edit
						});
					
					}
			
				})
			}
			else{
				res.render("all_u")
			}
			
			
		}
	});
});

app.post('/course/:topic',verifi, (req, res)=>{
	Student.findOne({course_title:cour,email:req.user.email},(err,foundUser)=>{
		enrolled="Click below to enrol"
		if(err){
			console.log(err)
		}else{
			if(foundUser){
				enrolled="You have already enrolled for this course"
				res.redirect("/"+foundUser.course_title)
			}else{
				const newStudent = new Student({
					email:req.user.email,
					course_title:req.body.course_title,
					duration:req.body.duration,
					start_date:req.body.start_date,
					f_time:req.body.f_time,
					t_time:req.body.t_time,
					name:req.user.name
			
				});
				newStudent.save((err)=>{
					if(err){
						console.log(err)
					}
					else{
						console.log("Successfully Saved")
						req.flash('message','Thanks for enrolling in '+cour)
						res.redirect("/")
					}
				})

			}
		}
	})
	
});




app.get('/course/edit/:topic',verifi,(req,res)=>{
	const re = _.startCase(req.params.topic);
	
		Course.find({course_title:re,start_date:{$gte: new Date()}}, (err, courses) => {
			if(err){
				console.log(err)
			}else{
				console.log(courses)
				if(courses.length>0){
					res.render("edit",{title:courses[0]["course_title"],description:courses[0]["course_description"],
				duration:courses[0]["duration"],start_date:courses[0]["start_date"],end_date:courses[0]["end_date"],
			min:courses[0]["min"],max:courses[0]["max"],price:courses[0]["price"]})
				}else{
					res.render("all_u")
				}
			
				
			}
		})
	
	// }else{
	// 	res.render("all_u")
	// }
	
	
	

	
	
	
})

app.post('/course/edit/:topic',verifi,(req,res)=>{
	const re = req.params.topic;
	console.log(cour)
	let {course_description,duration,start_date,end_date,min,max,price,f_time,t_time} = req.body;
	Course.findOneAndUpdate({course_title:cour},{course_description:course_description
	,duration:duration,start_date:start_date,end_date:end_date,min:min,max:max,price:price,f_time:f_time,t_time:t_time},(err)=>{
		if(err){
			console.log(err)
		}else{
			console.log("Successfully Edited")
			req.flash('message','Successfully Edited')
			res.redirect("/user")
		}
	
	})
})

app.get('*', function(req, res){
	res.render("all_u");
  });



process.on('unhandledRejection', (err) => { 
	console.error(err);
	process.exit(1);
  })




//Listener
let port = process.env.PORT;
if (port == null || port == "") {
  port = 3000;
}

app.listen(port,()=>{console.log("Server started listening on port "+port)})

//changes