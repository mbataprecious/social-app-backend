const admin = require('firebase-admin');
let serviceAccount = require('../util/serviceKey.json');

admin.initializeApp({
  credential: admin.credential.cert(serviceAccount),
  databaseURL: "https://socialapp-169f4.firebaseio.com"
});
const db=admin.firestore()



module.exports={admin,db}



