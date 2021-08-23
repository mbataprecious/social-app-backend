const {db,admin}=require('../util/admin')
const config=require('../util/config')

const firebase=require('firebase');
firebase.initializeApp(config)

const {checkValiditySignUp,checkValidityLogin,reduceUserDetails}=require('../util/validators')




 exports.signup=(req,res)=>{
    //initializing our userId & token
    let userId;
    let tokenId;
    let{email,password, confirmPassword,handle}=req.body

    const newUser={
        email,
        password,
        confirmPassword,
        handle
    }
    
    //Validation checks on the body recieved.....
   let {errors,isValid}=checkValiditySignUp(newUser)

   if(!isValid) return res.status(400).json(errors)
      
   let imgDefault='no-image.png'
    db.doc(`/users/${newUser.handle}`).get().then(doc=>{
        if(doc.exists){
            return res.status(400).json({ handle:'user handle already exist...'})
        }else{
        return    firebase.auth().createUserWithEmailAndPassword(newUser.email,newUser.password)
            .then(data=>{
                //passing the user authenticated id into our userId variable
            userId=data.user.uid
             return   data.user.getIdToken()
            }).then(token=>{
                tokenId=token
                let{email,handle}=newUser
             
                const userCredentials={
                    email,
                    createdAt:new Date().toISOString(),
                    userId,
                    imageUrl:`https://firebasestorage.googleapis.com/v0/b/${config.storageBucket}/o/${imgDefault}?alt=media`,
                    handle
                }
                db.doc(`/users/${newUser.handle}`).set(userCredentials);
            }).then(data=>{
                return res.status(201).json({tokenId}) 
            }).catch(err=>{
                console.error(err)
                if(err.code==='auth/email-already-in-use'){
                    res.status(400).json({email:'email is already in use'})
                }else{
                  return res.status(500).json({general: 'Something went wrong, please try again'})     
                }
               
            })   
        }
    })

}


exports.login=(request,response)=>{
    let userId;
    let tokenId;
    
    let{email,password}=request.body
 
    const user={
        email,
       password
    }
     //Validation checks on the body recieved.....
     let {errors,isValid}=checkValidityLogin(user)

     if(!isValid) return res.status(400).json(errors)


     firebase.auth().signInWithEmailAndPassword(user.email,user.password)
     .then(data=>{
        tokenId=data.user.getIdToken()
        userId=data.user.uid
        return tokenId
     }).then(token=>response.status(200).json({token}))
     .catch(err=>{
         if(err.code==='auth/wrong-password'){ 
             return response.status(403).json({general:'Wrong credentials please try again..'})
            }else{ 
                    return response.status(400).json({error:err.code})
                 }
     })

}

 




exports.uploadImage = (req, res) => {
    const BusBoy = require('busboy');
    const path = require('path');
    const os = require('os');
    const fs = require('fs');
  
    const busboy = new BusBoy({ headers: req.headers });
  
    let imageToBeUploaded = {};
    let imageFileName;
  
    busboy.on('file', (fieldname, file, filename, encoding, mimetype) => {
      console.log(fieldname, file, filename, encoding, mimetype);
      if (mimetype !== 'image/jpeg' && mimetype !== 'image/png') {
        return res.status(400).json({ error: 'Wrong file type submitted' });
      }
      // my.image.png => ['my', 'image', 'png']
      const imageExtension = filename.split('.')[filename.split('.').length - 1];
      // 32756238461724837.png
      imageFileName = `${Math.round(
        Math.random() * 1000000000000
      ).toString()}.${imageExtension}`;
      const filepath = path.join(os.tmpdir(), imageFileName);
      imageToBeUploaded = { filepath, mimetype };
      file.pipe(fs.createWriteStream(filepath));
    });
    busboy.on('finish', () => {
      admin
        .storage()
        .bucket(config.storageBucket)
        .upload(imageToBeUploaded.filepath, {
          resumable: false,
          metadata: {
            metadata: {
              contentType: imageToBeUploaded.mimetype
            }
          }
        })
        .then(() => {
          const imageUrl = `https://firebasestorage.googleapis.com/v0/b/${
            config.storageBucket
          }/o/${imageFileName}?alt=media`;
          return db.doc(`/users/${req.user.handle}`).update({ imageUrl });
        })
        .then(() => {
          return res.json({ message: 'image uploaded successfully' });
        })
        .catch((err) => {
          console.error(err);
          return res.status(500).json({ error: 'something went wrong' });
        });
    });
    busboy.end(req.rawBody);
  };

  
// Add user details
exports.addUserDetails = (req, res) => {
  let userDetails = reduceUserDetails(req.body);

  db.doc(`/users/${req.user.handle}`)
    .update(userDetails)
    .then(() => {
      return res.json({ message: 'Details added successfully' });
    })
    .catch((err) => {
      console.error(err);
      return res.status(500).json({ error: err.code });
    });
};

  exports.markNotificationsRead = (req, res) => {
    let batch = db.batch();
    req.body.forEach((notificationId) => {
      const notification = db.doc(`/notifications/${notificationId}`);
      batch.update(notification, { read: true });
    });
    batch
      .commit()
      .then(() => {
        return res.json({ message: 'Notifications marked read' });
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: err.code });
      });
  };

// Get any user's details
  exports.getUserDetails = (req, res) => {
    let userData = {};
    db.doc(`/users/${req.params.handle}`)
      .get()
      .then((doc) => {
        if (doc.exists) {
          userData.user = doc.data();
          return db
            .collection('screams')
            .where('userHandle', '==', req.params.handle)
            .orderBy('createdAt', 'desc')
            .get();
        } else {
          return res.status(404).json({ errror: 'User not found' });
        }
      })
      .then((data) => {
        userData.screams = [];
        data.forEach((doc) => {
          userData.screams.push({
            body: doc.data().body,
            createdAt: doc.data().createdAt,
            userHandle: doc.data().userHandle,
            userImage: doc.data().userImage,
            likeCount: doc.data().likeCount,
            commentCount: doc.data().commentCount,
            screamId: doc.id
          });
        });
        return res.json(userData);
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: err.code });
      });

      }

      
  exports.getAuthenticatedUser = (req, res) => {
    let userData = {};
    db.doc(`/users/${req.user.handle}`)
      .get()
      .then((doc) => {
        console.log(doc.data())
        if (doc.exists) {
          userData.credentials = doc.data();
          return db
            .collection('likes')
            .where('userHandle', '==', req.user.handle)
            .get();
        }
      })
      .then((data) => {
        userData.likes = [];
        data.forEach((doc) => {
          userData.likes.push(doc.data());
        });
        return db
          .collection('notifications')
          .where('recipient', '==', req.user.handle)
          .orderBy('createdAt', 'desc')
          .limit(10)
          .get();
      })
      .then((data) => {
        userData.notifications = [];
        data.forEach((doc) => {
          userData.notifications.push({
            recipient: doc.data().recipient,
            sender: doc.data().sender,
            createdAt: doc.data().createdAt,
            screamId: doc.data().screamId,
            type: doc.data().type,
            read: doc.data().read,
            notificationId: doc.id
          });
        });
        return res.json(userData);
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: err.code });
      });
  };


  exports.markNotificationsRead = (req, res) => {
    let batch = db.batch();
    req.body.forEach((notificationId) => {
      const notification = db.doc(`/notifications/${notificationId}`);
      batch.update(notification, { read: true });
    });
    batch
      .commit()
      .then(() => {
        return res.json({ message: 'Notifications marked read' });
      })
      .catch((err) => {
        console.error(err);
        return res.status(500).json({ error: err.code });
      });
  };
  