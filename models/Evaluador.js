const mongoose = require('mongoose');

const EvaluadorSchema = new mongoose.Schema({
    estatus: {
        type: String,
        required: false
    },
    estatusid: {
        type: String,
        required: false
    },
    observacionesid: {
        type: String,
        required: false
    },
    observaciones: {
        type: String,
        required: false
    },
    date: {
        type: Date,
        default: Date.now
    }

});

const Evaluador = mongoose.model('Evaluador', EvaluadorSchema);

module.exports = Evaluador;