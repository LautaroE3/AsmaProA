const mongoose = require('mongoose');
const bcrypt = require('bcrypt');

const saltRounds = 10;

const Adminschema = new mongoose.Schema({
    username: {type: String, required: true, unique: true},
    password: {type: String, required: true}
});

Adminschema.pre('save',function(next){
    if(this.isNew || this.isModified('password')){
        const document = this;
        bcrypt.hash(document.password,saltRounds,(err,hashedPassword)=>{
            if(err){
                next(err);
            }else{
                document.password = hashedPassword;
                next();
            }
        });
    }
});

Adminschema.methods.isCorrectPassword = function(password,callback){
    bcrypt.compare(password,this.password,function(err,same){
        if(err){
            callback(err);
        }else{
            callback(err,same);
        }
    });
}
Administrador= mongoose.model('Adminschema',Adminschema);
module.exports= Administrador;