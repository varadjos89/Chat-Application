const mongo= require('mongodb').MongoClient;
var express = require('express');
var session= require('express-session');
var bodyparser= require('body-parser');
var app= express();
var em;
const client=require('socket.io').listen(4002).sockets;



//connect to mongodb
mongo.connect('mongodb://127.0.0.1/mongochat',function(err, db)
{
    if(err){
        throw err;
    }
    console.log('Mongodb connected');
    //connect to socket.io
    client.on('connection',function(socket){
        let db2=db.db('chats');
        let user= db2.collection('users');
 
        let db3=db.db('chats');
        let con= db3.collection('connections');

        let dbl=db.db('chats');
        let chat= dbl.collection('text');

        let db4=db.db('chats');
        let grp_con= db4.collection('group_connection');

        let db5=db.db('chats');
        let grp_chat= db5.collection('group_text');
        // Create function to send status
        

        sendStatus = function(s){
            socket.emit('status', s);
        }

        socket.on('create group', function(data){
            let name=data.name;
            let email1=data.email1;
            let email2=data.email2;
            let email3=data.email3;
            grp_con.find({name:name}).toArray(function(err, ress) {
                if(err)
                {
                    client.emit('create status', 0);
                    throw err;
                }
                else if(ress=='')
                {
                    grp_con.insertOne({name: name, email1:email1, email2:email2, email3:email3}, function(err){
                        if(err){
                            client.emit('create status', 0);
                            throw err;
                        }
                        else{
                            client.emit('create status', 1);
                            console.log(name+" "+email1);
                        }            
                    });
                }
                else{
                    client.emit('create status', -1);
                }
               
        });
      });

        socket.on('register', function(data){
            let email=data.email;
            let username=data.username;
            let password=data.password;
            if(email=='' && username=='' && password=='')
            {
                sendStatus('Please enter the data correctly');
            }
            else
            {
                user.find({email:email}).toArray(function(err, ress) {
                    if(err)
                    {
                        client.emit('registration status', 0);
                        throw err;
                    }
                    else{
                         if(ress=='')
                         {
                            user.insertOne({email: email, username:username, password:password}, function(err){
                                if(err){
                                    client.emit('registration status', 0);
                                    throw err;
                                }
                                else{
                                    client.emit('registration status', 1);
                                }            
                            });
                         }   
                         else
                            client.emit('registration status', -1);
                    }
                });
        }

        });

        socket.on('adduserrequest',function(email){

            user.find({email:email}).toArray(function(err, result) {
                if(err){
                    client.emit('user status',0);
                    throw err;
                }
                else{
                    if(result=='')
                       client.emit('user status', -1);

                    else{
                       client.emit('user status', email);
                    }
                }
            });
        });

        socket.on('adduser',function(data){
            var username2=data.username;
            var email1=data.email1;
            var email2=data.email2;
            user.find({email:email1}).toArray(function(err, result) {
             var username1=result[0].username;   
            con.insertOne({email1: email1, username1:username1, email2: email2, username2:username2}, function(err){
                if(err){
                    client.emit('adduser status', 0);
                    throw err;
                }
                else{
                    client.emit('adduser status', 1);
                }            
            });     
        });
       });

       

       socket.on('show chats',function(data){
        let email1 = data.email1;
        let email2 = data.email2;
        //console.log(email1+" "+email2);
        chat.find({email1: email1, email2: email2}).toArray(function(err, result) {
            if(err){
                throw err;
            }
            else if(result!=''){
                //console.log(result[0].message);
                /*console.log(result[1].message);
                console.log(result[2].message);
                console.log(result[3].message);*/
                client.emit('output chats', result);
            }    
      });
     });


        socket.on('login', function(data){
            em=data.email;
            let password=data.password;
            
            if((em=='')&&(password==''))
            {
                sendStatus('Please enter the data correctly'); 
            }
            else
            {           
                    user.find({email:em,password:password}).toArray(function(err, result) {
                        if(err){
                            client.emit('login status',0);
                            throw err;
                        }
                        else{
                            if(result=='')
                               client.emit('login status', -1);
    
                            else{
                               client.emit('login status', result[0].username);
                               //console.log(result[0].email);
                            
                            }
                       }
                    });      
                }
            });

        // Get chats from mongo collection
        /*chat.find().limit(100).sort({_id:1}).toArray(function(err, res){
            if(err){
                throw err;
            }

            // Emit the messages
            socket.emit('output chats', res);
        });*/

        con.find({$or: [{email2:em}, {email1:em}]}).sort({_id:1}).toArray(function(err, res){
    
            if(err){
                throw err;
            }

            // Emit the messages
            socket.emit('output con', res);
        });

        grp_con.find({$or: [{email3:em},{email2:em},{email1:em}]}).sort({_id:1}).toArray(function(err, res){
    
            if(err){
                throw err;
            }

            // Emit the messages
            socket.emit('output grp_con', res);
        });


        socket.on('input', function(data){
            let email1 = data.email1;
            let email2 = data.email2;
            let sender= data.sender;
            let message= data.message;
            // Check for name and message
            if(email1 == '' && email2 == ''&& sender == '' && message == ''){
                // Send error status
                sendStatus('Please enter a name and message');
            } else {
                // Insert message
                chat.insertOne({email1: email1, email2: email2, sender: sender, message: message }, function(){
                    if(err){
                        throw err;
                    }
                    else{
                        client.emit('output chats', [data]);
                    }
                });
            }
        });

        // Handle clear
        socket.on('clear', function(data){
            // Remove all chats from collection
            chat.remove({}, function(){
                // Emit cleared
                socket.emit('cleared');
            });
        });
    });
});