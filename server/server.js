const { Pool } = require('pg');
const db = new Pool({
  connectionString: process.env.DATABASE_URL,
  ssl: {
    rejectUnauthorized: false
  }
});

const axios = require('axios')
const moment = require('moment')
const bodyParser = require('body-parser')
const { json } = require('body-parser')
const express = require('express');
const path = require('path');
const PORT = process.env.PORT || 5000;
const app = express()
var timeslots1=[]
var timeslots2={}
var finaltimeslots=[]
app.use(bodyParser.json())
app.use(
  bodyParser.urlencoded({
    extended: true,
  })
)
let allowCrossDomain = function(req, res, next) {
	res.header('Access-Control-Allow-Origin', "*");
	res.header('Access-Control-Allow-Headers', "*");
	res.header('Access-Control-Allow-Methods', "*");
	next();
  }
  app.use(allowCrossDomain);

 app.use(express.static(path.join(__dirname, 'public')))
 
 app.set('views', path.join(__dirname, 'views'))
 app.set('view engine', 'ejs')
 
 app.delete('/delete/member', (req, res) => {
	 if (req.body) {
		db.query("delete from member where id=$1 returning *",
			[req.body.id]
		)
		.then((data)=>res.status(200).json(data.rows))
		.catch((err)=>res.status(400).send("Failed to delete!"))
	 } else {
		 res.status(500).send("Failed to find body.")
	 }
	}
 )
 app.patch('/update/member', (req, res) => {
	 if (req.body) {
		db.query("update member set firstName=$1,lastName=$2,middleName=$3,unit=$4,email=$5 where id=$6 returning *",
			[req.body.firstName,req.body.lastName,req.body.middleName,req.body.unit,req.body.email,req.body.id]
		)
		.then((data)=>res.status(200).json(data.rows))
		.catch((err)=>res.status(400).send("Failed to update!"))
	 } else {
		 res.status(500).send("Failed to find body.")
	 }
	}
 )
 app.post('/submit/member', (req, res) => {
	 if (req.body) {
		db.query("insert into member(firstName,lastName,middleName,unit,email,phone) values($1,$2,$3,$4,$5,$6) returning *",
			[req.body.firstName,req.body.lastName,req.body.middleName,req.body.unit,req.body.email,req.body.phone]
		)
		.then((data)=>res.status(200).json(data.rows))
		.catch((err)=>res.status(400).send("Failed to submit!"))
	 } else {
		 res.status(500).send("Failed to find body.")
	 }
	}
 )
 app.get('/members',(req,res)=>{
	 if (req.query.search) {
		 db.query("select * from member where TRIM(CONCAT(firstname, ' ', lastname)) ilike $1 or TRIM(CONCAT(lastname, ' ', firstname)) ilike $1 or firstName ilike $1 or lastName ilike $1 or email ilike $1 order by lastName asc limit 10",["%"+req.query.search+"%"])
		 .then((data)=>{res.status(200).json(data.rows)})
		.catch((err)=>res.status(400).send("Failed to retrieve data!"))
	 } else  
	 if (req.query.id) {
		 db.query("select * from member where id=$1",[req.query.id])
		 .then((data)=>{res.status(200).json(data.rows[0])})
		.catch((err)=>res.status(400).send("Failed to retrieve data!"))
	 } else {
		 db.query("select * from member")
		 .then((data)=>{res.status(200).json(data.rows)})
		.catch((err)=>res.status(400).send("Failed to retrieve data!"))
	 }
 })
 
 app.delete('/delete/timeslot', (req, res) => {
	 if (req.body) {
		db.query("delete from timeslot where id=$1 returning *",
			[req.body.id]
		)
		.then((data)=>res.status(200).json(data.rows))
		.catch((err)=>res.status(400).send("Failed to delete!"))
	 } else {
		 res.status(500).send("Failed to find body.")
	 }
	}
 )
 app.patch('/update/timeslot', (req, res) => {
	 if (req.body) {
		db.query("update timeslot set capacity=$1,startDate=$2,endDate=$3 where id=$4 returning *",
			[req.body.capacity,req.body.startDate,req.body.endDate,req.body.id]
		)
		.then((data)=>res.status(200).json(data.rows))
		.catch((err)=>res.status(400).send("Failed to update!"))
	 } else {
		 res.status(500).send("Failed to find body.")
	 }
	}
 )
 app.post('/submit/log', (req, res) => {
	 if (req.body) {
		db.query("insert into log(action,date,memberid) values($1,$2,$3) returning *",
			[req.body.action,req.body.date,req.body.memberid]
		)
		.then((data)=>res.status(200).json(data.rows))
		.catch((err)=>res.status(400).send("Failed to submit!"))
	 } else {
		 res.status(500).send("Failed to find body.")
	 }
	}
 )
 app.get('/log', (req, res) => {
	 if (req.query.start&&req.query.end) {
		db.query("select * from log where date>=$1 and date<=$2",
		[req.query.start,req.query.end])
		.then((data)=>res.status(200).json(data.rows))
		.catch((err)=>res.status(400).send("Failed to submit!"))
	 } else {
		db.query("select * from log")
		.then((data)=>res.status(200).json(data.rows))
		.catch((err)=>res.status(400).send("Failed to submit!"))
	 }
	}
 )
 app.post('/submit/timeslot', (req, res) => {
	 if (req.body) {
		db.query("insert into timeslot(capacity,startDate,endDate) values($1,$2,$3) returning *",
			[req.body.capacity,req.body.startDate,req.body.endDate]
		)
		.then((data)=>res.status(200).json(data.rows))
		.catch((err)=>res.status(400).send("Failed to submit!"))
	 } else {
		 res.status(500).send("Failed to find body.")
	 }
	}
 )
 app.get('/timeslot',(req,res)=>{
	 /*if (req.query.after) {
		 db.query("select * from timeslot where endDate>$1 order by endDate asc",[req.query.after])
		 .then((data)=>{res.status(200).json(data.rows)})
		.catch((err)=>res.status(400).send("Failed to retrieve data!"))
	 } else 
	 if (req.query.id) {
		 db.query("select * from timeslot where id=$1",[req.query.id])
		 .then((data)=>{res.status(200).json(data.rows)})
		.catch((err)=>res.status(400).send("Failed to retrieve data!"))
	 } else {
		 db.query("select * from timeslot order by endDate asc")
		 .then((data)=>{res.status(200).json(data.rows)})
		.catch((err)=>res.status(400).send("Failed to retrieve data!"))
	 }*/
	 if (req.query.after) {
		res.status(200).json(finaltimeslots.filter(slot=>slot.enddate.isAfter(moment())))
	 } else 
	 if (req.query.id) {
		 res.status(200).json(finaltimeslots[req.query.id])
	 } else {
		res.status(200).json(finaltimeslots)
	 }
 })
 
 app.get('/event',(req,res)=>{
	 res.status(200).json(timeslots1)
 })
 
 app.get('/event/signups',(req,res)=>{
	 if (req.query.id) {
		res.status(200).json(timeslots2[req.query.id])
	 } else  if (req.query.all) {
		res.status(200).json(timeslots2)
	 } else {
		res.status(404).send("Id not found!")
	 }
 })
 
 app.delete('/delete/slot', (req, res) => {
	 if (req.body) {
		db.query("delete from slot where id=$1 returning *",
			[req.body.id]
		)
		.then((data)=>res.status(200).json(data.rows))
		.catch((err)=>res.status(400).send("Failed to delete!"))
	 } else {
		 res.status(500).send("Failed to find body.")
	 }
	}
 )
 app.patch('/update/slot', (req, res) => {
	 if (req.body) {
		db.query("update slot set memberId=$1,timeslotId=$2,arriveDate=$3,checkoutDate=$4,declined=$5,secondDose=$6,signupslot=$8 where id=$7 returning *",
			[req.body.memberId,req.body.timeslotId,req.body.arriveDate,req.body.checkoutDate,req.body.declined,req.body.secondDose,req.body.id,req.body.signupslot]
		)
		.then((data)=>res.status(200).json(data.rows))
		.catch((err)=>res.status(400).send("Failed to update!"))
	 } else {
		 res.status(500).send("Failed to find body.")
	 }
	}
 )
 app.post('/submit/slot', (req, res) => {
	 if (req.body) {
		db.query("insert into slot(memberId,timeslotId,arriveDate,checkoutDate,declined,secondDose,signupslot) values($1,$2,$3,$4,$5,$6,$7) returning *",
			[req.body.memberId,req.body.timeslotId,req.body.arriveDate,req.body.checkoutDate,req.body.declined,req.body.secondDose,req.body.signupslot]
		)
		.then((data)=>res.status(200).json(data.rows))
		.catch((err)=>res.status(400).send("Failed to submit!"))
	 } else {
		 res.status(500).send("Failed to find body.")
	 }
	}
 )
 app.get('/slot',(req,res)=>{
	 if (req.query.timeslotdate) {
		db.query("select slot.*,member.firstname,member.lastname,member.unit,member.email,member.unit,member.phone from slot inner join member on member.id=slot.memberid where signupslot=$1 order by lastname asc",[req.query.timeslotdate])
		 .then((data)=>{res.status(200).json(data.rows)})
		.catch((err)=>res.status(400).send("Failed to retrieve data!"))
	 } else {
		 db.query("select * from slot")
		 .then((data)=>{res.status(200).json(data.rows)})
		.catch((err)=>res.status(400).send("Failed to retrieve data!"))
	 }
 })
 app.post('/submit/password', (req, res) => {
	 if (req.body) {
		db.query("insert into password(password) values($1) returning *",
			[req.body.password]
		)
		.then((data)=>res.status(200).json(data.rows))
		.catch((err)=>res.status(400).send("Failed to submit!"))
	 } else {
		 res.status(500).send("Failed to find body.")
	 }
	}
 )
 app.post('/authenticate',(req,res)=>{
	 if (req.body) {
		 db.query("select * from password where password=$1",
			[req.body.password]
		 )
		 .then((data)=>{
			 if (data.rows.length>0) {
				res.status(200).json({authenticated:true})
			 } else {
				 res.status(200).json({authenticated:false})
			 }
		 })
		.catch((err)=>res.status(400).send("Failed to authenticate!"))
	 } else {
		 res.status(500).send("Failed to find body.")
	 }
 })
 
 app.listen(PORT, () => console.log(`Listening on ${ PORT }`));
 
 function GetData1(){
	return axios.get("https://api.signupgenius.com/v2/k/signups/created/active/",{params:{user_key:"MTdkRDUwOXFUUGxqb0ZpbDNsRDBIQT09"}})
	  .then((data)=>{timeslots1=data.data.data})
	.catch((err)=>console.log(err.message))
 }
 
 function GetData2(){
	timeslots1.forEach((slot)=>{
			console.log("Data for slot "+slot.signupid)
			axios.get("https://api.signupgenius.com/v2/k/signups/report/filled/"+slot.signupid+"/",{params:{user_key:"MTdkRDUwOXFUUGxqb0ZpbDNsRDBIQT09"}})
			.then((data)=>{timeslots2[slot.signupid]=data.data.data})
			.catch((err)=>console.log(err.message))
		}
	)
 }
 
var newmembers = 0,added=0,addedslots=0;
 function UpdateMembers() {
	 if (newmembers>0||added>0||addedslots>0) {
		 console.log("New Members: "+newmembers+" | Added Members: "+added+" | Added Slots: "+addedslots)
		 newmembers=0
		 added=0
		 addedslots=0
	 }
	for (var k of Object.keys(timeslots2)) {
		var signups = timeslots2[k].signup
		signups.forEach((signup)=>{
			//console.log(signup)
			var memberid=undefined;
			var signupdate = moment(moment(signup.startdatestring).utcOffset("+09").format("YYYY-MM-DD")+" "+signup.item.substring(0,2)+":"+signup.item.substring(2,4)+":00+09")
			db.query("select * from member where firstname ilike $1 and lastname ilike $2 and email ilike $3",
				[signup.firstname,signup.lastname,signup.email]
			)
			.then((data)=>{
				if (data.rows.length===0) {
					return db.query("insert into member(firstName,lastName,middleName,unit,email,phone) values($1,$2,$3,$4,$5,$6) returning *",
						[signup.firstname,signup.lastname,'',signup.customfields[1].value,signup.email,signup.phone]
					)
				} else {
					memberid=data.rows[0].id;
					return undefined
				}
			}
			)
			.then((data)=>{if (data!==undefined){memberid=data.rows[0].id;newmembers++;console.log(memberid)}})
			.then(()=>{
				return db.query("select * from slot where signupslot=$1 and memberid=$2",
					[signupdate,memberid]
				)
			})
			.then((data)=>{
				if (data.rows.length===0) {
					addedslots++
					return db.query("insert into slot(memberid,signupslot,seconddose) values($1,$2,$3) returning *",
					[memberid,signupdate,(signup.customfields[0].value=="2")])
				}
			})
			.catch((err)=>{console.log(err.message);added++})
		})
	}
 }
 function UpdateTimeslots() {
	 finaltimeslots=[]
	 timeslots1.forEach((slot)=>{
		for (var j=0;j<5;j++) {
			var starttime=moment(slot.startdatestring).add(j,'days')
			for (var i=0;i<28;i++) {
				var result = {}
				result.startdate=starttime
				result.enddate=moment(starttime).add(20,'minutes')
				result.capacity=24
				result.id=j*28+i
				finaltimeslots=[...finaltimeslots,result]
				starttime=moment(starttime).add(20,'minutes')
			}
		}
	 })
 }
 
setTimeout(()=>{
 GetData1()
 .then(()=>{
	 GetData2()
 })
 },10000)
 
 setTimeout(()=>{console.log("Update members and timeslots.")
	UpdateTimeslots()
	UpdateMembers()
 },60000)
 
 setInterval(()=>{console.log("Update members and timeslots.")
	UpdateTimeslots()
	UpdateMembers()
},900000)

 setInterval(()=>{console.log("Update registrations.")
	GetData2()
},1800000)
 setInterval(()=>{console.log("Update timeslots.")
	GetData1()
 },43200000)