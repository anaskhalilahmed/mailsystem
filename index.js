var express=require('express');
const https=require('https');
const path=require('path');
const fs=require('fs');
var app=express();
//note before using nodemailer turn on less secured app
var nodemailer=require('nodemailer');
var bodyParser = require('body-parser');
//bodyparser is a middleware
app.use(bodyParser.json());
app.use(bodyParser.urlencoded({ extended: true }));

app.use(express.static(__dirname+"/public"));

var mongoose=require('mongoose');
mongoose.Promise = global.Promise;
mongoose.set('useFindAndModify', false);
mongoose.connect("mongodb://testdb:test123@ds163354.mlab.com:63354/testdbanas", { useNewUrlParser: true });

//to integrate pug engine
app.set('views',"./public/twig");
//jis file ko app pug ka zariya used kar rahah ho us ka path denay ha or extension us file ki pug honi chaiyeh
//now set engine
app.set('view engine','twig');





//now we verify the email verification

//firstly we desing thee signup schema for user registration
var signup_schema=mongoose.Schema({
name:String,
email:String,
isvalid:String,
});

var SignModel=mongoose.model("emialverification",signup_schema);
var smtpTransporter = nodemailer.createTransport({
    service: 'gmail',
    auth: {
      user: "anaskhalilahmed@gmail.com",
      pass: "dvxzdckiecpujjpy"
    }
  });


app.get("/",function(req,res){
res.sendFile(__dirname+"/public"+"/verify.html");
});




app.get("/.well-known/pki-validation/09CC293A57DF324324A175593E03162C.txt",function(req,res){
res.sendFile(__dirname+"/public"+"/.well-known"+"/pki-validation"+"/09CC293A57DF324324A175593E03162C.txt");
});




app.post("/send",function(req,res){
SignModel.find({name:req.body.name,email:req.body.email},function(err,result){
//if user already exist so show message that user is already taken
if(result.length!=0 && result[0].isvalid=="true"){
// res.send("This User IS AlREADY TAKEN");
res.render("verify",{message1:"This user is already taken"});
// console.log(result);
}
//if user already exist but not varified so we again verified the user from resend the link
else if(result.length!=0 && result[0].isvalid=="false"){
  res.render("verify",{message:"This User is availiable but not verify do you want to verify",data:result});
}
else{
  var First=new SignModel({name:req.body.name,email:req.body.email,isvalid:"false"});
First.save(function(err,result){
if(err) throw err;

//now makes a setup to send mail to the user jo user email ki field ma ho gay usi ko hum email sned 
//karay gay 
var info={
  from:"anaskhaliahmed@gmail.com",
to:result.email,
subject:"please click on this ink to verify",
//this html is property which we used to send html elements
html:"<a href="+"http://mailsystem1.herokuapp.com/verify/"+result._id+">click to verify you<a>"
}
smtpTransporter.sendMail(info, function(error, info){
  if (error) {
    console.log(error);
  } else {
res.render("verify",{message2:"Please check your email to confirm email address."});
  }
});
});
}
});
});

//this route will execute when user click on link from gmail jo link hum na send kiya hay
//is ka allwa jo user signup karay gay to woh mongoose ma chalay jai gay but isvalid=false ho gay
//hum is result ka object sa id fetch kar kay us user ko mail karay gay
//agar to user us link pay click kartay hay to is id ka document jo req.parmas.id ma hay woh update ho 
//jai gay to isvalied=true ho jai gay
app.get("/verify/:id",function(req,res){
SignModel.findByIdAndUpdate(req.params.id,{isvalid:"true"},function(err,result){
if(err) throw err;
res.render("verify",{message3:"You are verify please login"});
});
});





app.get("/resend/verify/:id",function(req,res){
SignModel.findById(req.params.id,function(err,result){
if(err) throw err;
//now makes a setup to send mail to the user jo user email ki field ma ho gay usi ko hum email sned 
//karay gay 
var info={
  from:"anaskhaliahmed@gmail.com",
to:result.email,
subject:"please click on this ink to verify",
//this html is property which we used to send html elements
html:"<a href="+"http://mailsystem1.herokuapp.com/verify/"+result._id+">click to verify you<a>"
}
smtpTransporter.sendMail(info, function(error, info){
  if (error) {
    // console.log(error);
    res.send(error);
  } else {
res.render("verify",{message4:"Please check your email to confirm email address"});
  }
});
});
});








app.post("/login",function(req,res){
SignModel.find({name:req.body.name1,email:req.body.email1},function(err,result1){
// if(err) throw err;
//if user not found on this name and email
if(result1.length==0){
res.render("verify",{message5:"INVALID LOGIN."});
}
//if user found but not valid user
else if(result1[0].isvalid=="false"){
res.render("verify",{message6:"You must verify the email or again Sigup with same previous Name and email and login or make a new sign up"});
}
//if user found and isvalied==true so else runing
else{
  res.send("hello welcome"+result1[0].name);
}
});
});




var server=https.createServer({
    key:fs.readFileSync(path.join(__dirname,'cert','private.key')),
    cert:fs.readFileSync(path.join(__dirname,'cert','certificate.crt')),
    ca:fs.readFileSync(path.join(__dirname,'cert','ca_bundle.crt')),
},app);

server.listen(process.env.PORT||3000);
