if(process.env.NODE_ENV !== 'production'){
    require('dotenv').config();
}

const express = require('express');
const bcrypt = require('bcrypt');
const passport = require('passport');
const session = require('express-session');
const initPassport = require('./passport-config.js');
const {
    pubsubme, 
    PUB_NUEVO, 
    PUB_EDITAR, 
    SUB_ANADIR, 
    SUB_ACTUALIZAR,
    SUB_QUITAR,
    SES_CERRAR,
    SES_ABRIR
    } = require('./pubsub_init.js');
const generar_etiquetas = require('./utils.js')
const flash = require('express-flash');
const methodOverride = require('method-override');
const PubSub = require("pubsub-js");
const seedme = require("./seedme.js");
// Para guardar la base de datos de criterios.
const {categorias, anos_exp, jornada, contrato}  = require('./criterios.js');

pubsubme();

const usuarios = [];
var tablon_global = [];
tablon_global = seedme();

initPassport(
    passport, 
    email => usuarios.find(user=> user.email === email),
    id => usuarios.find(user=> user.id === id)
);


const app = express();
app.set('view-engine', 'ejs');
app.use('/public', express.static('public'));
app.use(express.urlencoded({extended: false}));
app.use(flash());
app.use(session({
    secret: process.env.SESSION_SECRET,
    resave: false,
    saveUninitialized: false
}));
app.use(passport.initialize());
app.use(passport.session());
app.use(methodOverride('_method'));

app.delete('/logout', (req,res) => {
    //PubSub.publish(SES_CERRAR, {user: req.user});
    req.logOut();
    res.redirect('/login');
});

app.get('/publicar', checkAuth, (req,res)=>{
    res.render('publicar.ejs', { user:req.user,
        tags:{
            categorias: categorias,
            anos_exp: anos_exp,
            jornada: jornada,
            contrato: contrato,
        }
    });
});

app.get('/sub/add', checkAuth, (req,res)=>{
    res.render('subs_add.ejs', { user: req.user, error: req.error,
        tags:{
            categorias: categorias,
            anos_exp: anos_exp,
            jornada: jornada,
            contrato: contrato,
        }
    });
});
app.post('/sub/delete/:id', checkAuth, (req,res)=>{
    PubSub.publish(SUB_QUITAR, {
        id: req.params.id,
        user: req.user,
        req: req
    });
    req.flash("noti", "Has eliminado la subscripción!");
    res.redirect('/mitablon');
});

app.post('/sub/add', checkAuth, (req,res)=>{
    // suscribeme mamawebo.
    var tag_catg = categorias.find(c => c.id == req.body.catg);
    var tag_anoe = anos_exp.find(c => c.id == req.body.anos);
    var tag_jorn = jornada.find(c => c.id == req.body.jorn);
    var tag_cont = contrato.find(c => c.id == req.body.cont);
    var array_tag = [];
    if(tag_catg != null) array_tag.push(tag_catg.tag);
    if(tag_anoe != null) array_tag.push(tag_anoe.tag);
    if(tag_jorn != null) array_tag.push(tag_jorn.tag);
    if(tag_cont != null) array_tag.push(tag_cont.tag);
    var tagsub = array_tag.join('.');
    if(tagsub == ''){
        req.flash("error", "Elige una caracteristica primero!");
        return res.redirect('/sub/add');
    }else if(req.user.subscriptions.find(s => s.tag === tagsub) != null){
        req.flash("error", "Ya estás suscrito con estos criterios, intenta cambiarlos.");
        return res.redirect('/sub/add');
    }
    PubSub.publish(SUB_ANADIR, {
        user: req.user,
        tagsub: tagsub,
        req: req,
    });
    req.flash("noti", "Subscripción realizada con exito!");
    res.redirect('/mitablon');
});

app.post('/publicar', checkAuth, (req,res)=>{
    var tagsub = generar_etiquetas([req.body.catg, req.body.anos, req.body.jorn, req.body.cont]);
    publicacion = {
        id: tablon_global.length,
        title: req.body.title, 
        description: req.body.desc,
        category: req.body.catg,
        exp_years: req.body.anos,
        duration: req.body.jorn,
        contract: req.body.cont,
        author: req.user.id,
        date: new Date().toDateString(),
        tags: tagsub
    };
    //PubSub.publish(publicacion.category, publicacion);
    console.log(publicacion);
    PubSub.publish(PUB_NUEVO, {
        pub: publicacion,
        tab: tablon_global 
    });
    tagsub.forEach((e)=>{
        PubSub.publish(e, {
            user: req.user,
            pub: publicacion,
            req: req
        });
    });
    req.flash("noti", "Tu publicacion se ha realizado con exito!");
    res.redirect('/');
});

app.get('/', (req,res)=>{
    //PubSub.publish(SES_ABRIR, {user: req.user});
    var tablon = tablon_global;
    var descendent = req.query.desc === '1';
    var order = req.query.por;
    if(order === 'catg'){
        tablon = tablon.sort((a,b) => descendent ? b.category - a.category : a.category - b.category)
    }
    else if(order === 'anos'){
        tablon = tablon.sort((a,b) => descendent ? b.exp_years - a.exp_years : a.exp_years - b.exp_years)
    }
    else if(order === 'jorn'){
        tablon = tablon.sort((a,b) => descendent ? b.duration - a.duration : a.duration - b.duration)
    }
    else if(order === 'cont'){
        tablon = tablon.sort((a,b) => descendent ? b.contract - a.contract : a.contract - b.contract)
    }
    res.render('index.ejs', {user: req.user, info: tablon, crit:{
        catg: categorias,
        anos: anos_exp,
        jorn: jornada,
        cont: contrato,
    }});
});
app.get('/mitablon', checkAuth, (req,res)=>{
    //console.log(req.user.tablon);
    res.render('mitablon.ejs', {
            user: req.user,
            name: req.user.name,
            info: req.user.tablon,
            crit:{
                catg: categorias,
                anos: anos_exp,
                jorn: jornada,
                cont: contrato,
            },
            subs: req.user.subscriptions
        });
});

app.get('/show/:id', (req,res)=>{
    publicacion = tablon_global.find(p => p.id == req.params.id);
    res.render('show.ejs', {pub: publicacion, users:usuarios, user: req.user, tags:{
        categorias: categorias,
        anos_exp: anos_exp,
        jornada: jornada,
        contrato: contrato,
    }});
});

app.get('/edit/:id', checkAuth, (req,res)=>{
    publicacion = tablon_global.find(p => p.id == req.params.id);
    res.render('editar.ejs', {pub: publicacion});
});

app.get('/login', checkNotAuth, (req,res)=>{
    res.render('login.ejs');
});
app.post('/login', checkNotAuth, passport.authenticate('local', {
    successRedirect: '/',
    failureRedirect: '/login',
    failureFlash: true
}));

app.get('/register', checkNotAuth, (req,res)=>{
    res.render('register.ejs');
});

app.post('/register', checkNotAuth, async (req,res)=>{
    try {
        const hashPass = await bcrypt.hash(req.body.pass, 10);
        const user = {
            id: Date.now().toString(),
            name: req.body.name,
            email: req.body.email,
            password: hashPass,
            subscriptions: [],
            tablon: [],
        };
        usuarios.push(user);
        req.flash("noti", "Registro realizado con exito! Ahora inicia tu sesión para empezar.");
        res.redirect('/login');
        //console.log(usuarios);
    } catch (error) {
        console.log(error);
        res.redirect('/register');
    }
    
});

function checkAuth(req, res, next){
    if(req.isAuthenticated()){
        return next();
    }
    res.redirect('/login');
}
function checkNotAuth(req, res, next){
    if(req.isAuthenticated()){
        res.redirect('/');
    }
    next();
}

app.listen(8080, ()=> console.log("Server started"));