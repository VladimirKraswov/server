// Затребуем библиотеку mongoose
const mongoose = require('mongoose');

module.exports = {
  connect: (DB_HOST) => {
    mongoose.set('useNewUrlParser', true); // Используем обновленный парсер строки URL драйвера Mongo
    mongoose.set('useFindAndModify', false); // Поставим findOneAndUpdate () вместо findAndModify ()
    mongoose.set('useCreateIndex', true); // Поставим createIndex () вместо sureIndex ()
    mongoose.set('useUnifiedTopology', true); // Используем новый механизм обнаружения и мониторинга серверов
    mongoose.connect(DB_HOST); // Подключаемся к БД
    // Выводим ошибку при неуспешном подключении
    mongoose.connection.on('error', (err) => {
      console.error(err);
      console.log('MongoDB connection error. Please make sure MongoDB is running.');
      process.exit();
    });
  },
  close: () => {
    mongoose.connection.close();
  },
};
