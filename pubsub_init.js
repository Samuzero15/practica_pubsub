const PubSub = require('pubsub-js');

const PUB_NUEVO ="publicacion_nueva";
const PUB_EDITAR = "publicacion_editar";
const SUB_ANADIR = "subscripcion_anadir";
const SUB_QUITAR = "subscripcion_quitar";
const SES_CERRAR = "sesion_cerrar";
const SES_ABRIR = "sesion_abrir";

exports.PUB_NUEVO =  PUB_NUEVO;
exports.PUB_EDITAR = PUB_EDITAR;
exports.SUB_ANADIR = SUB_ANADIR;
exports.SUB_QUITAR = SUB_QUITAR;
exports.SES_CERRAR = SES_CERRAR;
exports.SES_ABRIR = SES_ABRIR;

exports.pubsubme = () => {
        PubSub.subscribe(SUB_ANADIR, (msg, data)=>{
            // Aqui, añade la susbcripcion.
            if(!data.user.subscriptions.find(s => s.tag === data.tagsub)){
                var token = PubSub.subscribe(data.tagsub, (msg, data)=>{
                    if(!data.user.tablon.find(p => p.id == data.pub.id)){
                        data.user.tablon.push(data.pub);
                    }
                });
                data.user.subscriptions.push({
                    id: Date.now().toString(),
                    tag: data.tagsub,
                    token: token
                });
            }
        });
    
        PubSub.subscribe(SUB_QUITAR, (msg, data)=>{
            // Desuscribe al usuario primero.
            var desub = data.user.subscriptions.find(s => s.id == data.id);
            PubSub.unsubscribe(desub.token);

            // Luego, elimina su subscripcion del registro.
            var result = data.user.subscriptions.filter(s => s.id != data.id);

            data.user.subscriptions = result;
        });

        PubSub.subscribe(SES_ABRIR, (msg, data)=>{
            // Carga las subscripciones del usuario al iniciar la sesión.
            // Solo los subscribiremos 1 sola vez, sin duplicados.
            if(data.user != null && data.user.subscriptions.length > 0){
                data.user.subscriptions.forEach(s => {
                    var tagsub = s.tag;
                    PubSub.subscribeOnce(tagsub, (msg, data)=>{
                        if(!data.user.tablon.find(p => p.id == data.pub.id)){
                            data.user.tablon.push(data.pub);
                        }
                    });
                });
            }
        });

        PubSub.subscribe(SES_CERRAR, (msg, data)=>{
            // Borra las subscripciones del usuario al cerrar la sesión.
            data.user.subscriptions.forEach(s => {
                PubSub.unsubscribe(s.token);
            });
        });

        PubSub.subscribe(SUB_ANADIR, (msg, data)=>{
            // Aqui, añade la susbcripcion.
            if(!data.user.subscriptions.find(s => s.tag === data.tagsub)){
                var token = PubSub.subscribe(data.tagsub, (msg, data)=>{
                    if(!data.user.tablon.find(p => p.id == data.pub.id)){
                        data.user.tablon.push(data.pub);
                    }
                });
                data.user.subscriptions.push({
                    id: Date.now().toString(),
                    tag: data.tagsub,
                    token: token
                });
            }
            //console.log(data.user.subscriptions);
        });
    
        PubSub.subscribe(PUB_NUEVO, (msg, data)=>{
            data.tab.push(data.pub);
        });
    
        PubSub.subscribe(PUB_EDITAR, (msg, data)=>{
            data.tab.push(data.pub);
        });
    }


