//check email valid
const isEmail=(email)=>{
    let regEx=/^\w+([\.-]?\w+)*@\w+([\.-]?\w+)*(\.\w{2,3})+$/
       const valid= (email.match(regEx))?true:false
       return valid
    }
    //check if value is empty
    const isEmpty=(value)=>{
       const valid= (value==='')?true:false
       return valid
    }
    

exports.checkValiditySignUp=(data)=>{
let errors={}

if(isEmpty(data.email)){
    errors.email='Email must not be empty'
}else if(!isEmail(data.email)){
    errors.email='Must be a valid email address'
} 
if(isEmpty(data.password)){
    errors.password='password must not be empty'
}
if(data.confirmPassword!==data.password) errors.confirmPassword='password must match';
if(isEmpty(data.handle)) errors.handle='password must not be empty';


return {
    errors,
    isValid:(Object.keys(errors).length > 0)?false:true
}
}


exports.checkValidityLogin=(user)=>{
    let errors={}

    if(isEmpty(user.email)){
        errors.email='Email must not be empty'
    }
    if(isEmpty(user.password)){
        errors.password='password must not be empty'
    }
   
    return {
        errors,
        isValid:(Object.keys(errors).length > 0)?false:true
    }  
}


exports.reduceUserDetails = (data) => {
    let userDetails = {};
  
    if (!isEmpty(data.bio.trim())) userDetails.bio = data.bio;
    if (!isEmpty(data.website.trim())) {
      // https://website.com
      if (data.website.trim().substring(0, 4) !== 'http') {
        userDetails.website = `http://${data.website.trim()}`;
      } else userDetails.website = data.website;
    }
    if (!isEmpty(data.location.trim())) userDetails.location = data.location;
  
    return userDetails;
  };