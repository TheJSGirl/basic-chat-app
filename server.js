const mongo = require('mongodb');

const client = require('socket.io').listen(4000).sockets; 

//connect to mongodb
mongo.connect('mongodb://127.0.1/mongochat', (err, db) => {
  if(err){
    throw err;
  }
  
  console.log('connected');

  //connect to socket.io
  client.on('connection', () => {
    let chat = db.collection('chats');

    //create function to send status
    sendStatus = (s) => {
      socket.emit('status', s);
    }

    //get chat from mongo collection
    chat.find().limit(100).sort({_id : 1}).toArray((err, res) => {
    if(err){
          throw err;
        }

      //Emit the messages to the client
    socket.emit('output', res);
  });

    //handle input events
    socket.on('input', (data)=>{
      let name = data.name;
      let message = data.message;

      //check for name and message
    if(name == '' || message == ''){
        //send error status
        sendStatus('please enter the name and message');
      }
      else{
          //insert message in db
          chat.insert({name: name, message: message}, () => {
            client.emit('output', [data]);

            sendStatus({
              message: 'Message sent',
              clear: true
            });
          });
        }
    });

    //handle clear
    socket.on('clear', (data) => {
      //Remove all chats from the collections
      chat.remove({}, () =>{
        //emit cleared;
        socket.emit('cleared');
      });
    });
  });
});