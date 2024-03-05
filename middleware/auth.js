const isLogin = async (req, res, next) => {
    try {
      if  (req.session.user_id) {
        next();

      } else {
        res.redirect("/login");
        return;
      }
    } catch (error) {
      console.log(error.message);
    }
  };
  
  const isLogout = async (req, res, next) => {
    try {
      if (req.session.user_id) {


        res.redirect("/");
          return;

      } else {
        next();
      }
    } catch (error) {
      console.log(error.message);
    }
  };

  const checkBlock = async(req,res,next)=>{
    const userId = req.session.user_id;
    if(userId){
      try{
        const user = await User.findOne({_id:userId});
        if(user && user.isBlocked == true){
          return res.redirect('/login');
        }
      }catch(error){
        console.error(error.message)
      }
    }
    next();
  }
  
  module.exports = {
    isLogin,
    isLogout,
    checkBlock
  };