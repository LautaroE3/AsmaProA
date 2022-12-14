const express = require("express");
const app = express();
const path = require("path");
const morgan = require("morgan");
const cloudinary = require("cloudinary").v2;
const cors = require("cors");
const session = require("cookie-session");
const BodyParser= require('body-parser');
var cookieParser = require('cookie-parser');
//Base de Datos
const mongoose = require("mongoose");
const Admin = require("./models/myModel");
const PostModel = require("./models/postModel");
const Administrador=require("./models/Admin");
//hash
const bcrypt = require("bcrypt");
const { stringify } = require("querystring");
const mongo_uri='mongodb+srv://hrgarcia:EaFhXeNfxbG277Zz@cluster0.fs8tm.mongodb.net/myFirstDatabase?retryWrites=true&w=majority';
//variables globales para el logeo y los sweetsalert
global.isLogin = 0;
global.login = false;
global.idPosts= 1;


//vistas
app.set("view engine", "ejs");
//Defino la localización de mis vistas
app.set("views", path.join(__dirname, "views"));


app.use(cors());
app.use(cookieParser());
//Middlewares
app.use(session({
        secret: "keyboard cat",
        resave: true,
        saveUninitialized: true, 
    })
);

app.use(BodyParser.json());
app.use(morgan("dev"));
//Middleware para poder obtener data de los requests con BodyParser
app.use(express.json());
//Configurando archivos estáticos
app.use(express.urlencoded({ extended: true }));
app.use(express.static(path.join(__dirname, "public")));

const port = 3000;
//Corremos el servidor en el puerto seleccionado
app.listen(port, () => {
    console.log(`Servidor corriendo en el puerto ${port} correctamente`);
});
//Conexión al cloud de Mongodb Atlas ...
mongoose.connect(mongo_uri,function(err){
    if(err){
        throw err;
    } else{
        console.log(`Successfully connected to ${mongo_uri}`);
    }
});
//controlador principal
app.get("/", (req, res) => {
    req.session.usuario= 'Doctor';
    req.session.rol='Admin';
    res.status(200).render("index", { login: login, isLogin: isLogin });
});

//Controlador de Admin
app.get("/login", (req, res) => {
    res.status(200).render("login", { isLogin: isLogin, login: login });
});
app.post('/register',(req,res)=>{
    const {username,password}=req.body;

    const Admins = new Administrador({username,password});

    Admins.save(err=>{
        if(err){
            res.status(500).send('ERROR AL REGISTRAR USUARIO');
        }else{
            res.status(200).send('USUARIO REGISTRADO');
        }
    });
});
app.post("/login", (req, res) => {
        const {username,password}=req.body;
        Admins.findOne({username},(err,user)=>{
            if(err){
                res.status(500).send('ERROR AL AUTENTICAR AL USUARIO');
            }else if(!admin){
                res.status(500).send('EL USUARIO NO EXISTE');
            }else{
                admin
            }
        });

        Admins.find({ usuario: req.body.usuario }, (err, docs) => {
            if(req.body.usuario==docs[0].usuario){

            bcrypt.compare(req.body.contraseña,bcrypt.hashSync(docs[0].contraseña, 5),(err, resul) => {

                    console.log(docs[0].contraseña);
                    res.cookie("Login" , true, {expire : new Date() + 9999});
                    console.log("Cookies :  ", req.cookies.Login);
                    if (err) throw err;

                    if (resul) {

                        res.session = true;
                        login = res.session;
                        isLogin = 1;
                        res.status(200).render("edicionPosteos", {data:PostModel.find()});

                    } else {

                        isLogin = 2;
                        res.status(200).render("login", {isLogin: isLogin,login: login,});

                    }
                });
            }
            else {
                isLogin = 3;
                res.status(200).render("login", { isLogin: isLogin, login: login });
            }
            
        }); 
});

app.get('/seccionAdmin', (req, res) => {
    if(req.cookies.Login){
        res.status(200).render("edicionPosteos", {data:PostModel.find()});   
    }
    else{
        res.redirect("/login");
    }
});

app.get("/logout", (req, res) => {
    if (req.cookies.Login) {
        login = false;
        clearCookie("pepito");
        req.session.destroy();   
        res.redirect("/");
    } else {
        res.redirect("/");
    }
});
app.get("/error404", (req, res) => {
    res.status(200).render("error404");

});
app.get('/visualizar', (req, res) => {
    res.status(200).render("visualizarPost");
    
});

app.get("/kinesiologia", (req, res) => {
    res.status(200).render("kinesiologia");
    
});
app.get("/saludMental", (req, res) => {
    res.status(200).render("saludmental");
    
});
app.get("/neumonologia", (req, res) => {
    res.status(200).render("neumonologia");
    
});
app.get("/postear", (req, res) => {
    if(login){
        res.status(200).render("postPrueba", { isLogin: isLogin, login: login });
    }
    else{
        isLogin = 4
        res.redirect("/"); //Hacer vista o algo con esto
    }


});
app.post("/subirpost", (req, res) => {
        let fecha=req.body.fecha;
        let titulo= req.body.titulo;
        let descripcion = req.body.descripcion;
        let imagen = req.body.imagen;
        let enlace = req.body.enlace;
        let tag = req.body.tag;

        let post = new PostModel({
        id:idPosts,
        fecha: fecha,
        titulo: titulo,
        descripcion: descripcion,
        imagen: imagen,
        enlace: enlace,
        tags: tag,
        });  
        post.save((err,db)=>{
            if(err) console.error(err);
            console.log("se guardo un posteo");
            PostModel.findOne().sort({id: -1}).exec(function(err, post) {   
            console.log("Ultimo Id:"+post.id.toString());
                idPosts=post.id+1;
            });
            })
            res.status(200).render("edicionPosteos", {data:PostModel.find()});
            
});



app.get("/config", (req, res) => {
    if(req.cookies.Login){
        res.status(200).render("config");
    }
    else{
        res.redirect("/login");
    }
});

app.post("/ChangeDatos", (req, res) => {
    res.status(200).render("login");
    if (req.cookies.Login) {
        Admin.findOneAndUpdate({ nombre: "admin" },
{ $set: { contraseña: req.body.contraseña } }, { new: true }, function (err, doc) {
                if (err) console.log("Error ", err);
                console.log("Updated Doc -> ", doc);
                res.status(200).render("login", { isLogin: isLogin, login: login });
            });


            Admin.findOneAndUpdate({ nombre: "admin" },
            { $set: { usuario: req.body.usuario } }, { new: true }, function (err, doc) {
                if (err) console.log("Error ", err);
                console.log("Updated Doc -> ", doc);
                res.status(200).render("login", { isLogin: isLogin, login: login });
            });


    }
});



app.get("/*", (req, res) => {
    res.status(200).render("error404");
    
});



app.get("/subirPost", (req, res) => {
    res.status(200).render("postear2");
});




//RUTAS
/*
  
    router.route("/edicion").get(adminController.edicion);
    router.route("/editarPosteo").get(adminController.editarPost);
  
*/




app.post("/cargarImagen", async (req, res) => {
    res.render("config");
});
app.post("/guardarImagen", async (req, res) => {
    res.render("config");
});

module.exports = app;
