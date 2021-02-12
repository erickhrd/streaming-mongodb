const mongoose = require('mongoose');

const ClienteSchema = mongoose.Schema({
    nombre: {
        type: String,
        required: true
    },
    apellido1: {
        type: String,
        required: true
    },
    apellido2: {
        type: String,
        required: false
    }, 
    calle: {
        type: String,
        required: true
    },
    numero: {
        type: Number,
        required: true
    },
    colonia: {
        type: String,
        required: true
    },
    codigop: {
        type: Number,
        required: true
    }, 
    telefono: {
        type: Number,
        required: true
    },
    rfc: {
        type: String,
        required: true
    },
    documentos: {
        type: Object,
        required: true
        
    },
    date: {
        type: Date,
        default: Date.now
    }

});


const Cliente = mongoose.model('Cliente', ClienteSchema);


module.exports = Cliente;

