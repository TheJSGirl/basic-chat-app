const mongoDB = require('mongodb').MongoClient;
const socketIO = require('socket.io').listen(4000).sockets; 
const url = 'mongodb://localhost:27017/mongoChat';

//connect to mongodb
// mongodb.connection()  takes the DB URI and returns the database created
mongoDB.connect(url , (err, db) => {
  if(err){
    /**
     * if there is any error while trying to connect to the DB
     * console log the error and exit the process
     */
    console.log(err);
    process.exit(-1);
  }
  console.log('Successfully connected to MongoDB');

  //  In socketIO, listen to the event 'connection'. When a new client connects to the 
  //  server console log a message with the socket id of client who is just connected 
  
  socketIO.on('connection', (socket) => { 

    console.log('new client connected with socketID: ', socket.id);
  
    // db.colection() returns the collection specified, here we specified 'chats' collection
    db.collection('chats', (err, collection) => {

      //create function to send status to the client socket 
      sendStatus = (s) => {
        socket.emit('status', s);
      }

      //get chat from mongo collection
      collection.find().limit(100).sort({_id : 1}).toArray((err, res) => {
        if(err){
          throw err;
        }

          //  Emit the data from DB to the client making a custom event 'output'
          console.log(res);
          socket.emit('dbdata', res);
      });

      //  handle input events emmited from client socket
      //
      socket.on('input', (data)=>{
        let name = data.name;
        let message = data.message;

        //  check for name and message
        if(name == '' || message == ''){
          
          //  send error status to client socket 
          sendStatus('please enter the name and message');
        }

        else{
            // insert message in db
            collection.insert({name: name, message: message}, () => {
              
              socket.emit('dbdata', [data]);

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
        collection.remove({}, () =>{ 
          //emit cleared;
          socket.emit('cleared');
        });
      });
    }); // closing of collection callback
  });
});