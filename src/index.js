const express = require('express');
require('dotenv').config();
const {ApolloServer} = require('apollo-server-express');
const db = require('./db');
const jwt = require('jsonwebtoken');
const helmet = require('helmet');
const cors = require('cors');
const depthLimit = require('graphql-depth-limit');
const {createComplexityLimitRule} = require('graphql-validation-complexity');

const models = require('./models');
const typeDefs = require('./schema');
const resolvers = require('./resolvers');

const port = process.env.PORT || 4000;
const DB_HOST = process.env.DB_HOST; // Сохраняем значение DB_HOST в виде переменной

// Получаем информацию пользователя из JWT
const getUser = (token) => {
  if (token) {
    try {
      return jwt.verify(token, process.env.JWT_SECRET); // Возвращаем информацию пользователя из токена
    } catch (err) {
      new Error('Session invalid'); // Если с токеном возникла проблема, выбрасываем ошибку
    }
  }
};

const app = express();

app.use(helmet()); //Помогает защитить ваши приложения Express, устанавливая различные заголовки HTTP.
app.use(cors()); // Для работы с внешними доменами

// Подключаем БД
db.connect(DB_HOST);

// Настраиваем Apollo Server
const server = new ApolloServer({
  typeDefs,
  resolvers,
  validationRules: [depthLimit(5), createComplexityLimitRule(1000)],
  context: async ({req}) => {
    const token = req.headers.authorization; // Получаем из заголовков токен пользователя
    const user = await getUser(token); // Пробуем извлечь пользователя с помощью токена
    return {models, user}; // Добавляем модели БД и пользователя в контекст
  },
});

server.applyMiddleware({app, path: '/api'}); // Применяем промежуточное ПО Apollo GraphQL и указываем путь к /api

app.listen({port}, () => console.log(`GraphQL Server running at http://localhost:${port}${server.graphqlPath}`));
