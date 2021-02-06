import logo from './logo512.png';
import './App.css';
import React, {useState,useEffect,useRef} from 'react';
import {
  BrowserRouter as Router,
  Switch,
  Route,
  Redirect,
  useRouteMatch,
  useParams,
  useHistory,
  useLocation,
  Link
} from "react-router-dom";
import {
	Container,
	Row,
	Col,
	Form,
	Button,
	Navbar,
	Nav,
	Modal,
	Table,
	OverlayTrigger,
	Tooltip,
	NavDropdown,
	Dropdown
} from "react-bootstrap";
import {
	PencilFill,
	TrashFill,
	PersonCheckFill,
	DoorOpenFill,
	CardChecklist,
	PersonPlus,
	Search
} from 'react-bootstrap-icons';
const md5=require('md5');
const axios = require('axios');
const moment = require('moment');
	
const modalStyle={border:"rgba(64,64,64,1) solid 2px",backgroundColor:"rgba(17,19,21,1.0)",color:"rgba(128,128,128,1)"}
const modalFormStyle={backgroundColor:"rgba(44,48,52,1.0)",color:"rgba(192,192,192,1)"}

const BACKEND_URL="https://glacial-coast-50848.herokuapp.com"

const CHECKIN = 0
const CHECKOUT = 2
const DECLINE = 4
const UNCHECKIN = 1
const UNCHECKOUT = 3
const UNDECLINE = 5
const FIRSTDOSE = 6
const SECONDDOSE = 7

function Authenticate(p) {
	const [pass,setPass] = useState("")
	const [disable,setDisable] = useState(false)
	const [error,setError] = useState("")
	
	function authenticate() {
	axios.post(BACKEND_URL+"/authenticate",{password:md5(pass)})
		.then(res=>{
			setDisable(false)
			if (res.data.authenticated) {
				p.setAuth(true)
				setError("")
			} else {
				setError("Incorrect Password.")
			}
		})
	}
	
	if (!p.auth) {
		return(
		<Row className="justify-content-md-center">
			<Col md={6}>
			{error.length>0&&<h1 className="text-danger">{error}</h1>}
			<Form>
				<Form.Label>Password</Form.Label>
					<Form.Control autoFocus disabled={disable} type="password" value={pass} onChange={(e)=>setPass(e.currentTarget.value)} placeholder="Password"/>
					<Button disabled={disable} onClick={()=>{setDisable(true);authenticate();}} variant="dark" type="submit">
						Submit
					</Button>
			</Form>
		</Col>
		</Row>
		)
	} else {
		return <>{p.children}</>
	}
}

function hash(number) {
	return (number*60+18).toString(16)
}
function unhash(hex) {
	return (parseInt(hex,16)-18)/60
}

function Member(p){
	const [search,setSearch] = useState("")
	const [results,setResults] = useState([])
	const [data,setData] = useState({})
	
	useEffect(()=>{
		var result = []
		if (search.length>0&&
		((search.charAt(0)=="1"&&search.length==88)||
		(search.charAt(0)=="N"&&search.length==89))) {
			setSearch(search.substring(35,61).trim()+","+search.substring(15,35).trim())
		} else
		if (search.length>0) {
			axios.get(BACKEND_URL+"/members",{params:{search:search.replace(", "," ").replace(","," ")}})
			.then((data)=>{
				result=[...data.data,{newpatient:true}]
				setResults(result)})
				window.scrollTo(0,document.body.scrollHeight);
		} else {
			setResults([])
		}
	},[search])
	
	function Checkin(ldata){
		if (!ldata) {
			axios.patch(BACKEND_URL+"/update/slot",
				{memberId:p.data.memberid,
				timeslotId:p.data.timeslotid,
				arriveDate:moment(),
				checkoutDate:undefined,
				declined:p.data.declined,
				secondDose:p.data.seconddose,
				id:p.data.id,
				signupslot:p.data.signupslot}
			)
			.then((data)=>{p.setUpdate(!p.update)})
			.then(()=>axios.post(BACKEND_URL+"/submit/log",{
				action:CHECKIN,
				date:moment(),
				memberid:p.data.memberid
			}))
		} else {
			if (!ldata.arrivedate) {
				axios.patch(BACKEND_URL+"/update/slot",
					{memberId:ldata.memberid,
					timeslotId:ldata.timeslotid,
					arriveDate:moment(),
					checkoutDate:undefined,
					declined:ldata.declined,
					secondDose:ldata.seconddose,
					id:ldata.id,
					signupslot:ldata.signupslot}
				)
				.then((data)=>{p.setUpdate(!p.update)})
				.then(()=>axios.post(BACKEND_URL+"/submit/log",{
					action:CHECKIN,
					date:moment(),
					memberid:ldata.memberid
				}))
			}
		}
	}
	
	function Checkout(ldata){
		axios.patch(BACKEND_URL+"/update/slot",
			{memberId:p.data.memberid,
			timeslotId:p.data.timeslotid,
			arriveDate:p.data.arrivedate,
			checkoutDate:moment(),
			declined:p.data.declined,
			secondDose:p.data.seconddose,
			id:p.data.id,
			signupslot:p.data.signupslot}
		)
		.then((data)=>{p.setUpdate(!p.update)})
		.then(()=>{
			axios.post(BACKEND_URL+"/submit/log",{
				action:CHECKOUT,
				date:moment(),
				memberid:p.data.memberid
			})
			if (p.data.seconddose) {
				axios.post(BACKEND_URL+"/submit/log",{
					action:SECONDDOSE,
					date:moment(),
					memberid:p.data.memberid
				})
			} else {
				axios.post(BACKEND_URL+"/submit/log",{
					action:FIRSTDOSE,
					date:moment(),
					memberid:p.data.memberid
				})
			}
		})
	}
	
	function GetStatusColor(){
		if (p.data.declined) {
			return "rgba(255,0,0,0.3)"
		} else 
		if (p.data.checkoutdate) {
			return "rgba(0,255,0,0.4)"
		} else
		if (p.data.arrivedate) {
			return "rgba(200,255,64,0.25)"
		} else {
			return "rgba(0,0,0,0)"
		}
	}
	
	return(
	<tr>
		{p.data?
		<>
		<td style={{background:GetStatusColor()}}>{p.data.lastname}</td>
		<td style={{background:GetStatusColor()}}>{p.data.firstname}</td>
		<td style={{background:GetStatusColor()}}>{p.data.unit}</td>
		<td style={{background:GetStatusColor()}}>{p.data.phone}</td>
		<td style={{background:GetStatusColor()}}>{p.data.seconddose?"2nd":"1st"}</td>
		<td style={{background:GetStatusColor()}}>{p.data.declined?"No":"Yes"}</td>
		<td style={{background:GetStatusColor()}}>
			{!p.data.arrivedate&&<OverlayTrigger placement="bottom" overlay={<Tooltip>Click to check-in this patient.</Tooltip>}>
				<Button variant="outline-success" onClick={()=>{Checkin()}}><PersonCheckFill/></Button>
				</OverlayTrigger>}{" "}
			{p.data.arrivedate&&!p.data.checkoutdate&&!p.data.declined&&<OverlayTrigger placement="bottom" overlay={<Tooltip>Click to check-out this patient.</Tooltip>}>
				<Button variant="outline-warning" onClick={()=>{Checkout()}}><DoorOpenFill/></Button>
				</OverlayTrigger>}{" "}
		<Button variant="outline-light" onClick={()=>{p.setModalData(p.data)}}><PencilFill/></Button></td>
		</>:
		<td colSpan="9">
		<Row>
			<Col xs={9} style={{textAlign:"right"}}>
					<b style={{float:"left"}}>&nbsp;{p.total-1} scheduled</b><b>Add new patient: </b>
			</Col>
				<Col xs={3}>
					<Form.Control autoFocus style={modalFormStyle} id={"me"+p.id} onChange={(t)=>{setSearch(t.currentTarget.value)}} type="text" placeholder="🔍 Scan or Search" value={search}/>
						{results.length>0&&<Row>
							{results.map((search,i)=><Col key={i} xs={12} onClick={(t)=>{
									if (search.newpatient) {
										p.setModalData2([document.getElementById("me"+p.id).value])
										setSearch("")
									} else {
										//console.log(search.lastname+", "+search.firstname) //Come back to this.
										//console.log(search)
										var match = p.arr.filter((obj)=>obj?obj.memberid===search.id:false)
										if (match.length===0) {
											p.setConfirmData([search.lastname+", "+search.firstname+" "+(search.middleName?search.middleName:"")+(search.unit?"("+search.unit+")":"")+(search.phone?"["+search.phone+"]":""),search.id])
											setSearch("")	
										} else {
											//console.log(match)
											if (!match[0].arrivedate) {
												Checkin(match[0])
											} else {
												p.setShowConfirmCheckout(true)
												p.setCheckoutData(match[0])
											}
											setSearch("")
										}
									}
								}} className="link" title={search.email}>{search.newpatient?<b style={{backgroundColor:"rgba(64,64,128,1)"}}>+ Register New Patient</b>:search.lastname+", "+search.firstname+" "+(search.middleName?search.middleName:"")+(search.unit?"("+search.unit+")":"")}</Col>)}
						</Row>}
				</Col>
			</Row>
		</td>}
		
	</tr>
	)
}

function Checkin(p){
	let { id } = useParams();
	const [data,setData] = useState([])
	const [members,setMembers] = useState([])
	const [show,setShow] = useState(false)
	const [modalData,setModalData] = useState([])
	const [disable,setDisable] = useState(false)
	const [error,setError] = useState(["","","",""])
	const [checkinDate,setCheckinDate] = useState(undefined)
	const [checkoutDate,setCheckoutDate] = useState(undefined)
	const [dose,setDose] = useState("1")
	const [declined,setDeclined] = useState(false)
	const [update,setUpdate] = useState(false)
	const [registerFirstName,setRegisterFirstName] = useState("")
	const [registerLastName,setRegisterLastName] = useState("")
	const [registerEmail,setRegisterEmail] = useState("")
	const [registerUnit,setRegisterUnit] = useState("")
	const [showRegister,setShowRegister] = useState(false)
	const [modalData2,setModalData2] = useState("")
	const [first,setFirst] = useState(true)
	const [first2,setFirst2] = useState(true)
	const [confirmShow,setConfirmShow] = useState(false)
	const [confirmData,setConfirmData] = useState("")
	const [first3,setFirst3] = useState(true)
	const [checkedin,setCheckedIn] = useState(0)
	const [checkedout,setCheckedOut] = useState(0)
	const [hasdeclined,setHasDeclined] = useState(0)
	const [checkedinCount,setCheckedInCount] = useState(0)
	const [showConfirmCheckout,setShowConfirmCheckout] = useState(false)
	const [checkoutData,setCheckoutData] = useState({})
	
	useEffect(()=>{
		axios.get(BACKEND_URL+"/timeslot",{params:{id:id}})
			.then((d)=>{setData(d.data)})
	},[id])
	
	useEffect(()=>{
		if (!first3&&confirmData!==undefined) {
			setConfirmShow(true)
		} else {
			setFirst3(false)
		}
	},[confirmData])
	
	useEffect(()=>{
		axios.get(BACKEND_URL+"/slot/",{params:{timeslotdate:moment(data.startdate)}})
			.then((d)=>{
				var members = d.data
				members = [...members,undefined]
				setMembers(members)
				setCheckedInCount(members.filter((member)=>member&&member.arrivedate).length)
				})
		const interval = setInterval(() => {
			setUpdate(!update)
		}, 5000);
		return () => clearInterval(interval);
	},[data,update])
	
	useEffect(()=>{
		setError(["","","",""])
		if (!first&&modalData!==undefined) {
			setCheckinDate(modalData.arrivedate?moment(modalData.arrivedate).format("YYYY-MM-DDTHH:mm"):undefined)
			setCheckoutDate(modalData.checkoutdate?moment(modalData.checkoutdate).format("YYYY-MM-DDTHH:mm"):undefined)
			setDose(modalData.seconddose?true:false)
			setDeclined(modalData.declined?true:false)
			setShow(true)
		} else {
			setFirst(false)
		}
	},[modalData])
	useEffect(()=>{
		setError(["","","",""])
		if (!first2&&modalData2!==undefined) {
			if (modalData2[0].indexOf(",")!==-1) {
				setRegisterFirstName(modalData2[0].substring(modalData2[0].indexOf(",")+1,modalData2[0].length).trim())
				setRegisterLastName(modalData2[0].substring(0,modalData2[0].indexOf(",")).trim())
			} else 
			if (modalData2[0].indexOf(" ")!==-1) {
				setRegisterFirstName(modalData2[0].substring(modalData2[0].indexOf(" ")+1,modalData2[0].length))
				setRegisterLastName(modalData2[0].substring(0,modalData2[0].indexOf(" ")))
			} else {
				setRegisterLastName(modalData2[0])
				setRegisterFirstName("")
			}
			setRegisterEmail("")
			setRegisterUnit("")
			setShowRegister(true)
		} else {
			setFirst2(false)
		}
	},[modalData2])
	
	function Checkout(ldata){
		axios.patch(BACKEND_URL+"/update/slot",
			{memberId:ldata.memberid,
			timeslotId:ldata.timeslotid,
			arriveDate:ldata.arrivedate,
			checkoutDate:moment(),
			declined:ldata.declined,
			secondDose:ldata.seconddose,
			id:ldata.id,
			signupslot:ldata.signupslot}
		)
		.then((data)=>{setUpdate(!update)})
		.then(()=>{
			axios.post(BACKEND_URL+"/submit/log",{
				action:CHECKOUT,
				date:moment(),
				memberid:ldata.memberid
			})
			if (ldata.seconddose) {
				axios.post(BACKEND_URL+"/submit/log",{
					action:SECONDDOSE,
					date:moment(),
					memberid:ldata.memberid
				})
			} else {
				axios.post(BACKEND_URL+"/submit/log",{
					action:FIRSTDOSE,
					date:moment(),
					memberid:ldata.memberid
				})
			}
		})
		setDisable(false)
		setShowConfirmCheckout(false)
	}
	
	function AddToTimeslot(){
		/*console.log(confirmData)
		console.log(moment(data.startdate))*/
		axios.post(BACKEND_URL+"/submit/slot",{
			//[req.body.memberId,req.body.timeslotId,req.body.arriveDate,req.body.checkoutDate,req.body.declined,req.body.secondDose,req.body.signupslot]
			memberId:confirmData[1],
			timeslotId:undefined,
			arriveDate:moment(),
			checkoutDate:undefined,
			declined:false,
			secondDose:false,
			signupslot:moment(data.startdate)
		})
		.then((data)=>{
				return axios.post(BACKEND_URL+"/submit/log",{
					action:CHECKIN,
					date:moment(),
					memberid:data.data[0].memberid
				})
		})
		.then((data)=>{setDisable(false);setConfirmShow(false);setUpdate(!update)})
		.catch((err)=>{setDisable(false)})
	}
	
	function validateAndSubmit(){
		var errors=["","","",""]
		if (checkoutDate&&checkinDate&&moment(checkoutDate).isBefore(moment(checkinDate))) {
			errors[1]="End date is before start date"
		}
		if (errors[0].length===0&&errors[1].length===0&&errors[2].length===0&&errors[3].length===0) {
			//Submit.
			setDisable(true)
			axios.patch(BACKEND_URL+"/update/slot",
				{memberId:modalData.memberid,
				timeslotId:modalData.timeslotId,
				arriveDate:checkinDate?moment(checkinDate):undefined,
				checkoutDate:checkoutDate?moment(checkoutDate):undefined,
				declined:declined,
				secondDose:dose,
				id:modalData.id,
				signupslot:modalData.signupslot}
			)
			.then(()=>{
				if (modalData.arrivedate&&!checkinDate) {
					axios.post(BACKEND_URL+"/submit/log",{
						action:UNCHECKIN,
						date:moment(),
						memberid:modalData.memberid
					})
				}
				if (!modalData.arrivedate&&checkinDate) {
					axios.post(BACKEND_URL+"/submit/log",{
						action:CHECKIN,
						date:moment(),
						memberid:modalData.memberid
					})
				}
				if (!modalData.checkoutdate&&checkoutDate) {
					axios.post(BACKEND_URL+"/submit/log",{
						action:CHECKOUT,
						date:moment(),
						memberid:modalData.memberid
					})
				}
				if (modalData.checkoutdate&&!checkoutDate) {
					axios.post(BACKEND_URL+"/submit/log",{
						action:UNCHECKOUT,
						date:moment(),
						memberid:modalData.memberid
					})
				}
				if (!modalData.declined&&declined) {
					axios.post(BACKEND_URL+"/submit/log",{
						action:DECLINE,
						date:moment(),
						memberid:modalData.memberid
					})
				}
				if (modalData.declined&&modalData.declined!=declined) {
					axios.post(BACKEND_URL+"/submit/log",{
						action:UNDECLINE,
						date:moment(),
						memberid:modalData.memberid
					})
				}
			})
			.then((data)=>{setDisable(false);setShow(false);setUpdate(!update)})
			.catch((err)=>{setDisable(false)})
		}
		setError(errors)
	}
	
	function validateAndSubmit2(){
		var errors=["","","",""]
		if (registerFirstName.length==0) {
			errors[0]="First Name Required."
		}
		if (registerLastName.length==0) {
			errors[1]="Last Name Required."
		}
		if (registerEmail.length==0) {
			errors[2]="Contact Number Required."
		}
		if (errors[0].length===0&&errors[1].length===0&&errors[2].length===0&&errors[3].length===0) {
			//Submit.
			setDisable(true)
			axios.post(BACKEND_URL+"/submit/member",
				{firstName:registerFirstName,
				lastName:registerLastName,
				middleName:"",
				unit:registerUnit,
				phone:registerEmail}
			)
			.then((d)=>{
				return axios.post(BACKEND_URL+"/submit/slot",{
				//[req.body.memberId,req.body.timeslotId,req.body.arriveDate,req.body.checkoutDate,req.body.declined,req.body.secondDose,req.body.signupslot]
				memberId:d.data[0].id,
				timeslotId:undefined,
				arriveDate:moment(),
				checkoutDate:undefined,
				declined:false,
				secondDose:false,
			signupslot:moment(data.startdate)}
			)})
			.then((data)=>{
				return axios.post(BACKEND_URL+"/submit/log",{
					action:CHECKIN,
					date:moment(),
					memberid:data.data[0].memberid
				})
			})
			.then((data)=>{setDisable(false);setShowRegister(false);setUpdate(!update)})
			.catch((err)=>{setDisable(false)})
		}
		setError(errors)
	}
	
	if (id) {
		return(
		<>
			<h2>Scheduled Members from {moment(data.startdate).format("MMM D YYYY  HH:mm:ss")+" ~ "+moment(data.enddate).format("MMM D YYYY  HH:mm:ss")}</h2>
			
		<Table size="sm" striped bordered hover variant="dark">
			<thead>
				<tr>
					<th>Last</th>
					<th>First</th>
					<th>Unit</th>
					<th>Phone</th>
					<th>Dose</th>
					<th>Accepted</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{members.map((member,id,arr)=><Member setShowConfirmCheckout={setShowConfirmCheckout} setCheckoutData={setCheckoutData} key={id} arr={arr} id={id} checkedin={checkedinCount} total={members.length} setConfirmData={setConfirmData} update={update} setShowRegister={setShowRegister} setModalData2={setModalData2} setUpdate={setUpdate} setModalData={setModalData} setShow={setShow} data={member}/>)}
			</tbody>
		</Table>
		<Modal show={show} onHide={()=>{setShow(false)}} backdrop="static" keyboard={false}>
			<Modal.Header style={modalStyle}>
				<Modal.Title>Edit Time Slot</Modal.Title>
				<Button disabled={disable} variant="outline-light" onClick={()=>{setShow(false);setModalData(undefined)}}>
					X
				</Button>
			</Modal.Header>
			<Modal.Body style={modalStyle}>
				<Form>
					<Form.Label>{error[0].length===0?<>Checkin Date</>:<>Checkin Date - <span style={{color:"red"}}>{error[0]}</span></>}</Form.Label>
					<Form.Control style={modalFormStyle} onChange={(t)=>{setCheckinDate(t.currentTarget.value)}} disabled={disable} type="datetime-local" value={checkinDate}/>
					<Form.Label>{error[1].length===0?<>End Date</>:<>End Date - <span style={{color:"red"}}>{error[1]}</span></>}</Form.Label>
					<Form.Control style={modalFormStyle} onChange={(t)=>{setCheckoutDate(t.currentTarget.value)}} disabled={disable} type="datetime-local" value={checkoutDate}/>
					<Row>
					<Col md={4} className="pt-2">
						<Form.Label>{error[2].length===0?<>Dose</>:<>Dose - <span style={{color:"red"}}>{error[2]}</span></>}</Form.Label>
						<Form.Control as="select" style={modalFormStyle} onChange={(t)=>{setDose(t.currentTarget.value)}} disabled={disable} value={dose}>
							<option value={false}>1st</option>
							<option value={true}>2nd</option>
						</Form.Control>
					</Col>
					<Col md={4} className="pt-2">
						<Form.Label>{error[3].length===0?<>Accepted</>:<>Accepted - <span style={{color:"red"}}>{error[3]}</span></>}</Form.Label>
						<Form.Control as="select" style={modalFormStyle} onChange={(t)=>{setDeclined(t.currentTarget.value)}} disabled={disable} value={declined}>
							<option value={false}>Yes</option>
							<option value={true}>No</option>
						</Form.Control>
					</Col>
					</Row>
				</Form>
			</Modal.Body>
			<Modal.Footer style={modalStyle}>
				<Button disabled={disable} variant="outline-light" onClick={()=>{setShow(false);setModalData(undefined)}}>
					Cancel
				</Button>
				<Button disabled={disable} onClick={()=>{validateAndSubmit()}} variant="outline-primary">
					Save
				</Button>
			</Modal.Footer>
		</Modal>
		<Modal show={showRegister} onHide={()=>{setShowRegister(false)}} backdrop="static" keyboard={false}>
			<Modal.Header style={modalStyle}>
				<Modal.Title>Register New Patient</Modal.Title>
				<Button disabled={disable} variant="outline-light" onClick={()=>{setShowRegister(false);setModalData2(undefined)}}>
					X
				</Button>
			</Modal.Header>
			<Modal.Body style={modalStyle}>
				<Form>
					<Form.Label>{error[1].length===0?<>Last Name</>:<>Last Name - <span style={{color:"red"}}>{error[1]}</span></>}</Form.Label>
					<Form.Control style={modalFormStyle} onChange={(t)=>{setRegisterLastName(t.currentTarget.value)}} disabled={disable} type="text" value={registerLastName}/>
					<Form.Label>{error[0].length===0?<>First Name</>:<>First Name - <span style={{color:"red"}}>{error[0]}</span></>}</Form.Label>
					<Form.Control style={modalFormStyle} onChange={(t)=>{setRegisterFirstName(t.currentTarget.value)}} disabled={disable} type="text" value={registerFirstName}/>
					<Form.Label>{error[2].length===0?<>Phone</>:<>Phone - <span style={{color:"red"}}>{error[2]}</span></>}</Form.Label>
					<Form.Control placeholder="Work or Home Number (e.g. 010-1234-5678)" style={modalFormStyle} onChange={(t)=>{setRegisterEmail(t.currentTarget.value)}} disabled={disable} type="text" value={registerEmail}/>
					<Form.Label>{error[3].length===0?<>Unit</>:<>Unit - <span style={{color:"red"}}>{error[3]}</span></>}</Form.Label>
					<Form.Control placeholder="Unit (Optional)" style={modalFormStyle} onChange={(t)=>{setRegisterUnit(t.currentTarget.value)}} disabled={disable} type="text" value={registerUnit}/>
				</Form>
			</Modal.Body>
			<Modal.Footer style={modalStyle}>
				<Button disabled={disable} variant="outline-light" onClick={()=>{setShowRegister(false);setModalData2(undefined)}}>
					Cancel
				</Button>
				<Button disabled={disable} onClick={()=>{validateAndSubmit2()}} variant="outline-primary">
					Save
				</Button>
			</Modal.Footer>
		</Modal>
		<Modal show={confirmShow} onHide={()=>{setConfirmShow(false)}} backdrop="static" keyboard={false}>
			<Modal.Header style={modalStyle}>
				<Modal.Title>Are you sure you want to assign<br/><br/>{confirmData&&confirmData[0]}<br/><br/>to this time slot?</Modal.Title>
			</Modal.Header>
			<Modal.Footer style={modalStyle}>
				<Button disabled={disable} variant="outline-danger" onClick={()=>{setConfirmShow(false);setConfirmData(undefined)}}>
					No
				</Button>
				<Button disabled={disable} onClick={()=>{AddToTimeslot()}} variant="outline-primary">
					Yes
				</Button>
			</Modal.Footer>
		</Modal>
		<Modal show={showConfirmCheckout} onHide={()=>{setShowConfirmCheckout(false)}} backdrop="static" keyboard={false}>
			<Modal.Header style={modalStyle}>
				<Modal.Title>Are you sure you want to checkout<br/><br/>{(checkoutData)?checkoutData.lastname+", "+checkoutData.firstname+" "+(checkoutData.middleName?checkoutData.middleName:"")+(checkoutData.unit?"("+checkoutData.unit+")":"")+(checkoutData.phone?"["+checkoutData.phone+"]":""):""}<br/><br/>to this time slot?</Modal.Title>
			</Modal.Header>
			<Modal.Footer style={modalStyle}>
				<Button disabled={disable} variant="outline-danger" onClick={()=>{setShowConfirmCheckout(false);setCheckoutData(undefined)}}>
					No
				</Button>
				<Button disabled={disable} onClick={()=>{Checkout(checkoutData)}} variant="outline-primary">
					Yes
				</Button>
			</Modal.Footer>
		</Modal>
		</>
		)
	} else {
		return(
		<>
			<Timeslots mode="checkin"/>
		</>
		)
	}
}

function TimeSlot(p){
	const location = useLocation();
	let history = useHistory();
	switch (p.mode){
		case "edit":{
			return (
			<tr>
				<td>{24}</td>
				<td>{moment(p.data.startdate).format("MMM D YYYY  HH:mm:ss")}</td>
				<td>{moment(p.data.enddate).format("MMM D YYYY  HH:mm:ss")}</td>
					{/*<td><Link to={"/signup?slot="+hash(p.data.id)}>{window.location.origin+"/signup?slot="+hash(p.data.id)}</Link></td>*/}
				<td><OverlayTrigger placement="top" overlay={<Tooltip>Edit</Tooltip>}>
				<Button variant="outline-light" onClick={()=>{p.setShow(true);p.setModalData(p.data)}}><PencilFill/></Button>
				</OverlayTrigger> <OverlayTrigger placement="top" overlay={<Tooltip>Delete</Tooltip>}> 
				<Button variant="outline-danger" onClick={()=>{p.setDeleteShow(true);p.setModalData(p.data)}}><TrashFill/></Button>
				</OverlayTrigger></td>
			</tr>)
		}break;
		default:{
			//Checkin mode.
			return (
			<tr>
				<td>{24}</td>
				<td>{moment(p.data.startdate).format("MMM D YYYY  HH:mm:ss")}</td>
				<td>{moment(p.data.enddate).format("MMM D YYYY  HH:mm:ss")}</td>
					{/*<td><Link to={"/signup?slot="+hash(p.data.id)}>{window.location.origin+"/signup?slot="+hash(p.data.id)}</Link></td>*/}
				<td>{/*<OverlayTrigger placement="top" overlay={<Tooltip>Check In</Tooltip>}>
				<Button variant="outline-light" onClick={()=>{p.setShow(true);p.setModalData(p.data)}}><PersonCheckFill/></Button>
				</OverlayTrigger> <OverlayTrigger placement="top" overlay={<Tooltip>Check Out</Tooltip>}> 
				<Button variant="outline-secondary" onClick={()=>{p.setDeleteShow(true);p.setModalData(p.data)}}><DoorOpenFill/></Button>
				</OverlayTrigger>*/<OverlayTrigger placement="top" overlay={<Tooltip>Check in this time slot</Tooltip>}>
				<Button variant="outline-light" onClick={()=>{history.push(location.pathname+"/"+p.data.id)}}><CardChecklist/></Button>
				</OverlayTrigger>}</td>
			</tr>)
		}
	}
}

function Timeslots(p){
	const [slots,setSlots] = useState([])
	const [update,setUpdate] = useState(false)
	const [show,setShow] = useState(false)
	const [deleteShow,setDeleteShow] = useState(false)
	const [modalData,setModalData] = useState({})
	const [disable,setDisable] = useState(false)
	const [startDate,setStartDate] = useState("")
	const [endDate,setEndDate] = useState("")
	const [capacity,setCapacity] = useState(24)
	const [error,setError] = useState(["","",""])
	const [id,setId] = useState(0)
	const [showAll,setShowAll] = useState(false)
	
	useEffect(()=>{
		if (showAll) {
			axios.get(BACKEND_URL+"/timeslot")
			.then((data)=>{setSlots(data.data)})
		} else {
			axios.get(BACKEND_URL+"/timeslot",{params:{after:moment()}})
			.then((data)=>{setSlots(data.data)})
		}
	},[update,showAll])
	
	useEffect(()=>{
		setStartDate(moment(modalData.startdate).format("YYYY-MM-DDTHH:mm"))
		setEndDate(moment(modalData.enddate).format("YYYY-MM-DDTHH:mm"))
		setCapacity(modalData.capacity)
		setId(modalData.id)
		setError(["","",""])
	},[modalData])
	
	function deleteTimeslot(){
		setDisable(true)
		axios.delete(BACKEND_URL+"/delete/timeslot",{data:{id:id}})
		.then((data)=>{setDisable(false);setDeleteShow(false);setUpdate(!update)})
		.catch((err)=>{setDisable(false)})
	}
	
	function validateAndSubmit(){
		var errors=["","",""]
		if (moment(endDate).isBefore(moment(startDate))) {
			errors[1]="End date is before start date"
		}
		if (capacity<0) {
			errors[2]="Capacity is negative"
		}
		if (errors[0].length===0&&errors[1].length===0&&errors[2].length===0) {
			//Submit.
			setDisable(true)
			axios.patch(BACKEND_URL+"/update/timeslot",{id:id,startDate:moment(startDate),endDate:moment(endDate),capacity:capacity})
			.then((data)=>{setDisable(false);setShow(false);setUpdate(!update)})
			.catch((err)=>{setDisable(false)})
		}
		setError(errors)
	}
	
	return <>
		{!showAll&&<Container>
				<Row className="justify-content-md-center">
					<Col xs={12}>
						<OverlayTrigger placement="bottom" overlay={<Tooltip>Only showing future time slots. Click to show past time slots.</Tooltip>}><Button size="sm" disabled={disable} variant="outline-light" onClick={()=>{setShowAll(true)}}>
							Show All
						</Button>
						</OverlayTrigger>
					</Col>
				</Row>
			</Container>}
		<Table striped bordered hover variant="dark">
			<thead>
				<tr>
					<th>Capacity</th>
					<th>Start Time</th>
					<th>End Time</th>
					<th></th>
				</tr>
			</thead>
			<tbody>
				{slots.length>0?slots.map((data,i)=>
				<TimeSlot mode={p.mode} setShow={setShow} setModalData={setModalData} id={i} setDeleteShow={setDeleteShow} data={data} key={i}/>):null}
			</tbody>
		</Table>
		{!showAll&&<Container>
			<Row className="justify-content-md-center">
				<Col xs={12}>
					<OverlayTrigger placement="bottom" overlay={<Tooltip>Only showing future time slots. Click to show past time slots.</Tooltip>}><Button size="sm" disabled={disable} variant="outline-light" onClick={()=>{setShowAll(true)}}>
						Show All
					</Button>
					</OverlayTrigger>
				</Col>
			</Row>
		</Container>}
		<Modal show={deleteShow} onHide={()=>{setShow(false)}} backdrop="static" keyboard={false}>
			<Modal.Header style={modalStyle}>
				<Modal.Title>Are you sure you want to delete this timeslot?</Modal.Title>
			</Modal.Header>
			<Modal.Footer style={modalStyle}>
				<Button disabled={disable} variant="outline-danger" onClick={()=>{setDeleteShow(false)}}>
					No
				</Button>
				<Button disabled={disable} onClick={()=>{deleteTimeslot()}} variant="outline-primary">
					Yes
				</Button>
			</Modal.Footer>
		</Modal>
		<Modal show={show} onHide={()=>{setShow(false)}} backdrop="static" keyboard={false}>
			<Modal.Header style={modalStyle}>
				<Modal.Title>Edit Time Slot</Modal.Title>
				<Button disabled={disable} variant="outline-light" onClick={()=>{setShow(false)}}>
					X
				</Button>
			</Modal.Header>
			<Modal.Body style={modalStyle}>
				<Form>
					<Form.Label>{error[0].length===0?<>Start Date</>:<>Start Date - <span style={{color:"red"}}>{error[0]}</span></>}</Form.Label>
					<Form.Control style={modalFormStyle} onChange={(t)=>{setStartDate(t.currentTarget.value)}} disabled={disable} type="datetime-local" value={startDate}/>
					<Form.Label>{error[1].length===0?<>End Date</>:<>End Date - <span style={{color:"red"}}>{error[1]}</span></>}</Form.Label>
					<Form.Control style={modalFormStyle} onChange={(t)=>{setEndDate(t.currentTarget.value)}} disabled={disable} type="datetime-local" value={endDate}/>
					<Row>
					<Col md={4} className="pt-2">
						<Form.Label>{error[2].length===0?<>Capacity</>:<>Capacity - <span style={{color:"red"}}>{error[2]}</span></>}</Form.Label>
						<Form.Control style={modalFormStyle} onChange={(t)=>{setCapacity(t.currentTarget.value)}} disabled={disable} type="number" value={capacity}/>
					</Col>
					</Row>
				</Form>
			</Modal.Body>
			<Modal.Footer style={modalStyle}>
				<Button disabled={disable} variant="outline-light" onClick={()=>{setShow(false)}}>
					Cancel
				</Button>
				<Button disabled={disable} onClick={()=>{validateAndSubmit()}} variant="outline-primary">
					Save
				</Button>
			</Modal.Footer>
		</Modal>
	</>
}

function Scheduler(p){
	return(
	<>
		<Timeslots mode="edit"/>
	</>
	)
}

function Statistics(p) {
	
  const [todayStats,setTodayStats] = useState({})
  const [yesterdayStats,setYesterdayStats] = useState({})
  const [weekStats,setWeekStats] = useState({})
  const [monthStats,setMonthStats] = useState({})
  const [allStats,setAllStats] = useState({})
  const [update,setUpdate] = useState({})
  
  useEffect(()=>{
	  axios.get(BACKEND_URL+"/log",{params:{}})
			.then((d)=>{
				var data = []
				data[CHECKIN]=0
				data[UNCHECKIN]=0
				data[CHECKOUT]=0
				data[UNCHECKOUT]=0
				data[DECLINE]=0
				data[UNDECLINE]=0
				d.data.forEach((log)=>
				{
					if (moment().dayOfYear()===moment(log.date).dayOfYear()) {
						if (data[log.action]) {data[log.action]++} else {data[log.action]=1}
					}
				})
				var finaldata={};
				finaldata[CHECKIN]=data[CHECKIN]-data[UNCHECKIN]
				finaldata[CHECKOUT]=data[CHECKOUT]-data[UNCHECKOUT]
				finaldata[DECLINE]=data[DECLINE]-data[UNDECLINE]
				setTodayStats(finaldata)
				
				data[CHECKIN]=0
				data[UNCHECKIN]=0
				data[CHECKOUT]=0
				data[UNCHECKOUT]=0
				data[DECLINE]=0
				data[UNDECLINE]=0
				d.data.forEach((log)=>
				{
					if (moment().subtract(1,'days').dayOfYear()===moment(log.date).dayOfYear()) {
						if (data[log.action]) {data[log.action]++} else {data[log.action]=1}
					}
				})
				finaldata={};
				finaldata[CHECKIN]=data[CHECKIN]-data[UNCHECKIN]
				finaldata[CHECKOUT]=data[CHECKOUT]-data[UNCHECKOUT]
				finaldata[DECLINE]=data[DECLINE]-data[UNDECLINE]
				setYesterdayStats(finaldata)
				
				data[CHECKIN]=0
				data[UNCHECKIN]=0
				data[CHECKOUT]=0
				data[UNCHECKOUT]=0
				data[DECLINE]=0
				data[UNDECLINE]=0
				d.data.forEach((log)=>
				{
					if (moment().week()===moment(log.date).week()) {
						if (data[log.action]) {data[log.action]++} else {data[log.action]=1}
					}
				})
				finaldata={};
				finaldata[CHECKIN]=data[CHECKIN]-data[UNCHECKIN]
				finaldata[CHECKOUT]=data[CHECKOUT]-data[UNCHECKOUT]
				finaldata[DECLINE]=data[DECLINE]-data[UNDECLINE]
				setWeekStats(finaldata)
				
				data[CHECKIN]=0
				data[UNCHECKIN]=0
				data[CHECKOUT]=0
				data[UNCHECKOUT]=0
				data[DECLINE]=0
				data[UNDECLINE]=0
				d.data.forEach((log)=>
				{
					if (moment().month()===moment(log.date).month()) {
						if (data[log.action]) {data[log.action]++} else {data[log.action]=1}
					}
				})
				finaldata={};
				finaldata[CHECKIN]=data[CHECKIN]-data[UNCHECKIN]
				finaldata[CHECKOUT]=data[CHECKOUT]-data[UNCHECKOUT]
				finaldata[DECLINE]=data[DECLINE]-data[UNDECLINE]
				setMonthStats(finaldata)
				
				data[CHECKIN]=0
				data[UNCHECKIN]=0
				data[CHECKOUT]=0
				data[UNCHECKOUT]=0
				data[DECLINE]=0
				data[UNDECLINE]=0
				d.data.forEach((log)=>
				{
					if (data[log.action]) {data[log.action]++} else {data[log.action]=1}
				})
				finaldata={};
				finaldata[CHECKIN]=data[CHECKIN]-data[UNCHECKIN]
				finaldata[CHECKOUT]=data[CHECKOUT]-data[UNCHECKOUT]
				finaldata[DECLINE]=data[DECLINE]-data[UNDECLINE]
				setAllStats(finaldata)
				})
		const interval = setInterval(() => {
			setUpdate(!update)
		}, 5000);
		return () => clearInterval(interval);
  },[update])
  
  return(<>
		<h1>Statistics</h1>
		<br/><br/><br/>
		<Container>
			<Row className="justify-content-md-center">
				<Col md={12}>
					<h3>Today</h3>
					<Table striped bordered hover variant="dark" size="sm">
					 <thead>
						<tr>
						  <th></th>
						  <th>Shots<br/>Administered</th>
						  <th>Checked In</th>
						  <th>Declined</th>
						</tr>
					  </thead>
					  <tbody>
						<tr>
						  <td>Today</td>
						  <td>{todayStats[CHECKOUT]}</td>
						  <td>{todayStats[CHECKIN]}</td>
						  <td>{todayStats[DECLINE]}</td>
						</tr>
						<tr>
						  <td>Yesterday</td>
						  <td>{yesterdayStats[CHECKOUT]}</td>
						  <td>{yesterdayStats[CHECKIN]}</td>
						  <td>{yesterdayStats[DECLINE]}</td>
						</tr>
						<tr>
						  <td>This Week</td>
						  <td>{weekStats[CHECKOUT]}</td>
						  <td>{weekStats[CHECKIN]}</td>
						  <td>{weekStats[DECLINE]}</td>
						</tr>
						<tr>
						  <td>This Month</td>
						  <td>{monthStats[CHECKOUT]}</td>
						  <td>{monthStats[CHECKIN]}</td>
						  <td>{monthStats[DECLINE]}</td>
						</tr>
						<tr>
						  <td>All Time</td>
						  <td>{allStats[CHECKOUT]}</td>
						  <td>{allStats[CHECKIN]}</td>
						  <td>{allStats[DECLINE]}</td>
						</tr>
						</tbody>
						</Table>
				</Col>
			</Row>
		</Container>
		</>
  )
}

function App() {
  const [auth,setAuth] = useState(false)
  const [eventData,setEventData] = useState({})
  const [hidebar,setHidebar] = useState(false)
	
  return (
  <>
	<Router>
	{!hidebar&&<Navbar bg="dark" variant="dark">
	 <Link style={{color:"rgba(192,192,192,1)",textDecoration:"none"}} to="/"><Navbar.Brand>
	  <img src="/logo512.png" width="30" height="30" className="d-inline-block align-top"/>{' '}Vaccine Tracker
	  </Navbar.Brand></Link>
	  <Nav>
		<Row>
		  <Col xs="auto"><Link className="pl-4 pr-4" style={{color:"rgba(192,192,192,1)",textDecoration:"none"}} to="/checkin">Checkin/Checkout</Link></Col>
		  <Col xs="auto"><Link className="pl-4 pr-4" style={{color:"rgba(192,192,192,1)",textDecoration:"none"}} to="/stats">Statistics</Link></Col>
		  <Col xs="auto">{auth&&<Link className="pl-4 pr-4" style={{color:"rgba(192,192,192,1)",textDecoration:"none"}} onClick={()=>setAuth(false)} to="/">Logout</Link>}</Col>
		 </Row>
		</Nav>
	</Navbar>}
    <div className="App">
      <header className="App-header">
			<Switch>
				<Route path="/signup">
					<h1>Signup Here.</h1>
				</Route>
				<Route path="/checkin/:id">
					<Container>
						<Row className="justify-content-md-center">
							<Col md={12}>
							  <Authenticate auth={auth} setAuth={setAuth}>
								<Checkin/>
							  </Authenticate>
							 </Col>
						 </Row>
					</Container>
				</Route>
				<Route path="/checkin">
					<Container>
						<Row className="justify-content-md-center">
							<Col md={12}>
							  <Authenticate auth={auth} setAuth={setAuth}>
								<Checkin/>
							  </Authenticate>
							 </Col>
						 </Row>
					</Container>
				</Route>
				<Route path="/schedule">
					<Container>
						<Row className="justify-content-md-center">
							<Col md={12}>
							  <Authenticate auth={auth} setAuth={setAuth}>
								<Scheduler/>
							  </Authenticate>
							 </Col>
						 </Row>
					</Container>
				</Route>
				<Route path="/stats">
					<Container>
						<Row className="justify-content-md-center">
							<Col md={12}>
							  <Authenticate auth={auth} setAuth={setAuth}>
								<Statistics/>
							  </Authenticate>
							 </Col>
						 </Row>
					</Container>
				</Route>
				<Route path="/">
					<Container>
						<Row className="justify-content-md-center">
							<Col md={12}>
							  Vaccine Tracker App
							 </Col>
						 </Row>
					</Container>
				</Route>
			</Switch>
	  </header>
	 </div>
	</Router>
	 </>
  );
}

export default App;
