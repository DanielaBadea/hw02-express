const app = require("./app");
const mongoose = require('mongoose');
require('dotenv').config();

const PORT = 3000;
const dbConnection = process.env.DATABASE_CONNECT;
console.log(dbConnection);

// mongoose.connect(dbConnection, {
//   useNewUrlParser: true,
//   useUnifiedTopology: true,
// }).then(() => {
//   console.log('Connected to the database');
// }).catch((err) => {
//   console.error('Database connection error:', err);
// });
mongoose.connect(dbConnection)
.then(()=> {
  console.log('Connected to the database');
})
.catch((err) => {
  console.error('Database connection error:', err);
});

app.listen(PORT, () => {
  console.log(`Server is running on port ${PORT}`);
});
