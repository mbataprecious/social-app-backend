const {db,admin}=require('../util/admin')


//user authentication to protect forbiden routes
module.exports=(req,res,next)=>{
    let idToken
        if(req.headers.authorization && req.headers.authorization.startsWith('Bearer ')){
            console.log(req.headers.authorization)
            idToken=req.headers.authorization.substring(7); 
        }else{
            return res.status(400).json({error:'unauthorized'})
        }


        admin.auth().verifyIdToken(idToken)
        .then(decodedToken=>{
            //decodedToken is an obj which contains the decoded userId===>uid created for authentication
            req.user=decodedToken;
            console.log(decodedToken)
            return db.collection('users').where('userId','==',req.user.uid)
            .limit(1).get()
        }).then(data=>{
            console.log(data)
           req.user.handle= data.docs[0].data().handle
           req.user.imageUrl = data.docs[0].data().imageUrl;
           return next()
        }).catch(err =>{
            console.error('Error while verifying token',err)
            return res.status(403).json(err)
        })
}