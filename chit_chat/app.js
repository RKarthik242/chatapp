const http=require("http");
const express=require("express");
const app=express();
const bodyParser = require('body-parser');
const server=http.createServer(app);
const port=process.env.PORT || 3000;
app.use(express.static(__dirname+"/public"));
app.use(bodyParser.urlencoded({extended:true}));
app.get('/',(req,res)=>{
   res.sendFile(__dirname+"/login.html");
});
app.post('/room', (req, res) => {
    room_name = req.body.room_name;
    user_name = req.body.user_name;
    res.redirect(`/room?user_name=${user_name}&room_name=${room_name}`);
});

//Rooms
app.get('/room', (req, res)=>{
    res.sendFile(__dirname+"/room.html");
});
const io =require("socket.io")(server);
var users={}; 
var sockets={};
io.on("connection",(socket)=>{
    socket.on("new-user-joined",(data)=>{
        var user = {};
        sockets[socket.id]=data.roomname;
        user[socket.id] = data.username;
        if(users[data.roomname]){
            users[data.roomname].push(user);
        }
        else{
            users[data.roomname] = [user];
        }
        socket.join(data.roomname);
        socket.broadcast.to(data.roomname).emit("user-connected",data.username);
        io.to(data.roomname).emit("user-list",users[data.roomname]);
    });     
    socket.on("disconnect",()=>{   
        var id=sockets[socket.id];
        delete sockets[socket.id];
        var p="";
        users[id].forEach(object => {
        p=object[socket.id];
        delete object[socket.id];
        });
        users[id] = users[id].filter(value => Object.keys(value).length !== 0)
        socket.broadcast.to(id).emit("user-disconnected",p);
        io.to(id).emit("user-list",users[id]);
    });
    socket.on("message",(data)=>{
        socket.broadcast.to(data.roomname).emit("message",{user:data.user,msg:data.msg});
    });
});

server.listen(port,()=>{
    console.log("server is connected "+port);
});
