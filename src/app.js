const express = require('express');
const cors = require('cors');
const app = express();


//settings
app.set('port', process.env.PORT || '0.0.0.0');
app.set('host',process.env.HOST || '0.0.0.0');

//const whitelist = ['https://brave-yonath-783630.netlify.app'];


/* const corsOptions = {
    origin: (origin,callback) => {
        const existe = whitelist.some(dominio => dominio === origin);
        if(existe){
            callback(null,true);
        }else{
            callback(new Error('Este server no tiene acceso'));
        }
    }
}
 */
//Middlewares cors con opcions
//app.use(cors(corsOptions));

//Middlewares cors sin opcions
app.use(cors());

app.use(express.json());

//rutes
app.use('/api/certificate', require('./routes/Certificates'));
app.use('/api/user', require('./routes/User'));
app.use('/api/course', require('./routes/Course'));
app.use('/api/banner', require('./routes/Banner'));
app.use('/api/sales', require('./routes/Sales'));
app.use('/api/notification', require('./routes/Notification'));
app.use('/api/categories', require('./routes/Categories'));
app.use('/api/cart', require('./routes/Cart'));
app.use('/api/comment',require('./routes/Comment'));
app.use('/api/homework',require('./routes/Homework'));
app.use('/api/pay',require('./routes/Pay'));
app.use('/api/send',require('./routes/send'));
app.use('/api/taller',require('./routes/Taller'));
app.use('/api/question',require('./routes/Questions'));
app.use('/api/packages',require('./routes/Packages'));
app.use('/api/templates',require('./routes/Templates'));
app.use('/api/appointment',require('./routes/Appointments'));
app.use('/api/product',require('./routes/Products'));
app.use('/api/paymentlink',require('./routes/PaymentLink'));

//carpeta publica
app.use(express.static('uploads'));

module.exports = app;
