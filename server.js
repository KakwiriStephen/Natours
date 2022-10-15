const mongoose = require('mongoose');
const dotenv = require('dotenv');

process.on('uncaughtException', (err) => {
    console.log('UNCAUGHT EXCEPTION ☀ shutting down...');
    console.log(err.name, err.message);
    console.log(err);

    process.exit(1);
});

const app = require('./app');

dotenv.config({ path: './config.env' });

const DB = process.env.DATABASE.replace(
    '<PASSWORD>',
    process.env.DATABASE_PASSWORD
);
mongoose
    .connect(DB, {
        useNewUrlParser: true,
        // useCreateIndex: true,
        // useFindAndModify: false,
        useUnifiedTopology: true,
    })
    .then((con) => {
        //console.log(con.connections);
        console.log('DB connection Successful');
    });

const port = process.env.PORT || 3000;

app.listen(port, () => {
    console.log(`App running on port ${port}...`);
});

//unhandled rejected promises

process.on('unhandledRejection', (err) => {
    console.log('UNHANDLED REJECTION ☀ shutting down...');
    Server.close(() => {
        process.exit(1);
    });
});